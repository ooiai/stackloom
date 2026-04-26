"use client"

import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { CameraIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAwsS3 } from "@/hooks/use-aws-s3"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import { Textarea } from "@/components/reui/textarea"
import { uploadAwsObject } from "@/lib/aws"
import { OSS_ENUM } from "@/lib/config/enums"
import {
  USER_GENDER_OPTIONS,
  USER_STATUS_OPTIONS,
  getDefaultUserFormValues,
  getUserAvatarFallback,
  getUserDisplayName,
} from "@/lib/users"
import { awsApi } from "@/stores/system-api"
import type {
  UserData,
  UserFormValues,
  UserMutateMode,
} from "@/types/base.types"
import { cn } from "@/lib/utils"
import { LabelField } from "@/components/topui/label-field"

interface UserMutateSheetProps {
  open: boolean
  mode: UserMutateMode
  user: UserData | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UserFormValues) => Promise<void>
}

interface UserMutateSheetHeader {
  title: string
  description: string
  submitLabel: string
}

interface SectionHeaderProps {
  title: string
  description: string
  className?: string
}

interface AvatarSectionProps {
  avatarLabel: string
  values: UserFormValues
  isUploadingAvatar: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
}

interface AccountSectionProps {
  children: ReactNode
}

interface ProfileSectionProps {
  children: ReactNode
}

const userFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "请输入用户名")
    .max(50, "用户名长度不能超过 50 个字符"),
  email: z.union([
    z.literal(""),
    z.email("请输入有效的邮箱地址").max(255, "邮箱长度不能超过 255 个字符"),
  ]),
  phone: z.string().trim().max(20, "手机号长度不能超过 20 个字符"),
  nickname: z.string().trim().max(100, "昵称长度不能超过 100 个字符"),
  avatar_url: z.union([
    z.literal(""),
    z.url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
      message: "请输入有效的头像地址",
    }),
  ]),
  gender: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  bio: z.string().trim().max(2000, "简介长度不能超过 2000 个字符"),
})

const createUserFormSchema = userFormSchema.extend({
  password: z
    .string()
    .min(8, "密码至少需要 8 位")
    .max(72, "密码长度不能超过 72 位"),
})

const updateUserFormSchema = userFormSchema.extend({
  password: z.string(),
})

const SHEET_HEADER_MAP: Record<UserMutateMode, UserMutateSheetHeader> = {
  create: {
    title: "新增用户",
    description: "录入基础信息并创建用户",
    submitLabel: "创建用户",
  },
  update: {
    title: "编辑用户",
    description: "维护当前用户资料",
    submitLabel: "保存变更",
  },
}

function getUserMutateSchema(mode: UserMutateMode) {
  return mode === "create" ? createUserFormSchema : updateUserFormSchema
}

function SectionHeader({ title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="space-y-1">
        <h3 className="text-sm leading-none font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-[12px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function AvatarSection({
  avatarLabel,
  values,
  isUploadingAvatar,
  fileInputRef,
  onAvatarFileChange,
}: AvatarSectionProps) {
  const triggerFileInput = () => fileInputRef.current?.click()

  const handleAvatarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      triggerFileInput()
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-5 transition-colors hover:border-border/80">
      <div className="flex flex-col items-start gap-5">
        <div className="flex items-center gap-4">
          <div
            className="group relative cursor-pointer rounded-full ring-offset-2 ring-offset-background transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
            role="button"
            tabIndex={0}
            aria-label="点击更换头像"
            onClick={triggerFileInput}
            onKeyDown={handleAvatarKeyDown}
          >
            <Avatar className="size-14 ring-2 ring-border/70 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary/60 sm:size-16">
              <AvatarImage src={values.avatar_url} alt={avatarLabel} />
              <AvatarFallback className="bg-primary/5 text-base font-semibold text-primary/80">
                {getUserAvatarFallback(values)}
              </AvatarFallback>
            </Avatar>

            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all duration-300 group-hover:bg-black/35">
              <CameraIcon className="size-5 translate-y-1 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
            </div>

            {isUploadingAvatar ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-[1px]">
                <Loader2Icon className="size-6 animate-spin text-white" />
              </div>
            ) : null}
          </div>

          <div className="min-w-0 space-y-1.5">
            <h2 className="text-base leading-tight font-semibold text-foreground">
              {avatarLabel}
            </h2>
            <p className="max-w-xs text-[12px] leading-5 text-muted-foreground">
              支持上传头像图片
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void onAvatarFileChange(event)}
        />
      </div>
    </section>
  )
}

function AccountSection({ children }: AccountSectionProps) {
  return (
    <section className="w-full space-y-5">
      <SectionHeader title="账户信息" description="维护用户账号信息" />
      <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

function ProfileSection({ children }: ProfileSectionProps) {
  return (
    <section className="space-y-5">
      <SectionHeader title="展示信息" description="展示用户额外信息" />
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function UserMutateSheet({
  open,
  mode,
  user,
  isPending,
  onOpenChange,
  onSubmit,
}: UserMutateSheetProps) {
  const { uploadFile } = useAwsS3()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const header = SHEET_HEADER_MAP[mode]
  const defaultValues = useMemo(() => getDefaultUserFormValues(user), [user])
  const schema = useMemo(() => getUserMutateSchema(mode), [mode])

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  const resetFormState = () => {
    form.reset(defaultValues)
    setShowPassword(false)
    setIsUploadingAvatar(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetFormState()
    } else {
      setShowPassword(false)
      setIsUploadingAvatar(false)
    }

    onOpenChange(nextOpen)
  }

  const handleCancel = () => {
    resetFormState()
    onOpenChange(false)
  }

  const handleAvatarFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件作为头像")
      return
    }

    try {
      setIsUploadingAvatar(true)
      const avatarUrl = await uploadAwsObject({
        file,
        folder: OSS_ENUM.IMAGES,
        uploadFile,
        getSts: () => awsApi.getSts({}),
      })
      form.setFieldValue("avatar_url", avatarUrl)
      form.setFieldMeta("avatar_url", (prev) => ({
        ...prev,
        errors: [],
        isTouched: true,
      }))
      toast.success("头像上传成功")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "头像上传失败，请稍后重试"
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const values = form.state.values
  const avatarLabel = useMemo(
    () =>
      getUserDisplayName({
        nickname: values.nickname,
        username: values.username || "用户头像",
      }) || "用户头像",
    [values.nickname, values.username]
  )

  const isBusy = isPending || isUploadingAvatar || form.state.isSubmitting

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-184">
        <SheetHeader className="border-b border-border/60 pb-5">
          <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
            {header.title}
          </SheetTitle>
          <SheetDescription className="max-w-xl text-sm leading-6 text-muted-foreground/70">
            {header.description}
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 pt-2 pb-6">
            <AvatarSection
              avatarLabel={avatarLabel}
              values={values}
              isUploadingAvatar={isUploadingAvatar}
              fileInputRef={fileInputRef}
              onAvatarFileChange={handleAvatarFileChange}
            />

            <FieldGroup>
              <AccountSection>
                <form.Field name="username">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="用户名"
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          disabled={mode === "update"}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          placeholder="请输入用户名"
                          className={cn(
                            "transition-colors",
                            mode === "update" &&
                              "cursor-not-allowed bg-muted/50 text-muted-foreground"
                          )}
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>

                <form.Field name="nickname">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="昵称"
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          placeholder="展示名称"
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>

                <form.Field name="email">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="邮箱"
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          placeholder="name@example.com"
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>

                <form.Field name="phone">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="手机号"
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          type="tel"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          placeholder="请输入手机号"
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>

                {mode === "create" ? (
                  <form.Field name="password">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid

                      return (
                        <LabelField
                          className="md:col-span-2"
                          label="登录密码"
                          htmlFor={field.name}
                          invalid={isInvalid}
                          tooltip={{ content: "密码至少 8 位，最长 72 位" }}
                          error={
                            isInvalid ? (
                              <FieldError errors={field.state.meta.errors} />
                            ) : null
                          }
                        >
                          <div className="relative">
                            <Input
                              id={field.name}
                              name={field.name}
                              type={showPassword ? "text" : "password"}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="设置登录密码"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
                              onClick={() => setShowPassword((prev) => !prev)}
                            >
                              {showPassword ? (
                                <EyeOffIcon className="size-4" />
                              ) : (
                                <EyeIcon className="size-4" />
                              )}
                              <span className="sr-only">
                                {showPassword ? "隐藏密码" : "显示密码"}
                              </span>
                            </Button>
                          </div>
                        </LabelField>
                      )
                    }}
                  </form.Field>
                ) : null}
              </AccountSection>

              <FieldSeparator className="-my-1.5" />

              <ProfileSection>
                <form.Field name="gender">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="性别"
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Select
                          name={field.name}
                          value={String(field.state.value)}
                          onValueChange={(value) =>
                            field.handleChange(Number(value) as 0 | 1 | 2)
                          }
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-invalid={isInvalid}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_GENDER_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </LabelField>
                    )
                  }}
                </form.Field>

                <form.Field name="status">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="状态"
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Select
                          name={field.name}
                          value={String(field.state.value)}
                          onValueChange={(value) =>
                            field.handleChange(Number(value) as 0 | 1 | 2)
                          }
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-invalid={isInvalid}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </LabelField>
                    )
                  }}
                </form.Field>
              </ProfileSection>

              <form.Field name="bio">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  const bioLength = field.state.value.trim().length

                  return (
                    <LabelField
                      label="个人简介"
                      htmlFor={field.name}
                      invalid={isInvalid}
                      description={
                        <span
                          className={cn(
                            "block text-right text-xs tabular-nums transition-colors",
                            bioLength > 1800
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {bioLength}/2000
                        </span>
                      }
                      error={
                        isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null
                      }
                    >
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={isInvalid}
                        placeholder="填写用户简介..."
                        className="min-h-28 resize-y text-[12px] leading-6"
                      />
                    </LabelField>
                  )
                }}
              </form.Field>
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 bg-muted/20 px-5 py-4">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full rounded-lg text-[13px] sm:w-auto"
                onClick={handleCancel}
                disabled={isBusy}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="h-9 w-full gap-2 rounded-lg bg-primary text-[13px] shadow-sm transition-all hover:bg-primary/90 hover:shadow-md sm:w-auto"
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : null}
                {header.submitLabel}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
