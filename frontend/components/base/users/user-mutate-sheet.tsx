"use client"

import { ChangeEvent, useMemo, useRef, useState } from "react"

import { useAwsS3, type AwsS3Token } from "@/hooks/use-aws-s3"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import { Textarea } from "@/components/reui/textarea"
import {
  USER_GENDER_OPTIONS,
  USER_STATUS_OPTIONS,
  getDefaultUserFormValues,
  getUserAvatarFallback,
  validateUserForm,
} from "@/lib/users"
import type {
  UserData,
  UserFormValues,
  UserMutateMode,
} from "@/types/base.types"
import {
  Loader2Icon,
  ShieldCheckIcon,
  UploadIcon,
  UserRoundIcon,
} from "lucide-react"
import { toast } from "sonner"

interface UserMutateSheetProps {
  open: boolean
  mode: UserMutateMode
  user: UserData | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UserFormValues) => Promise<void>
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
  const [values, setValues] = useState<UserFormValues>(
    getDefaultUserFormValues(user)
  )
  const [errors, setErrors] = useState<
    Partial<Record<keyof UserFormValues, string>>
  >({})
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const header = useMemo(
    () =>
      mode === "create"
        ? {
            title: "新增用户",
            description: "优先填写最关键的身份与联络信息，降低首次录入负担。",
            submitLabel: "创建用户",
          }
        : {
            title: "编辑用户",
            description: "只修改需要调整的资料，用户名保留为只读主标识。",
            submitLabel: "保存变更",
          },
    [mode]
  )

  const handleFieldChange = <T extends keyof UserFormValues>(
    key: T,
    value: UserFormValues[T]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setValues(getDefaultUserFormValues(user))
      setErrors({})
      setIsUploadingAvatar(false)
    }

    onOpenChange(nextOpen)
  }

  const handleSubmit = async () => {
    const nextErrors = validateUserForm(mode, values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    await onSubmit(values)
  }

  const resolveAwsS3Token = (): AwsS3Token | null => {
    const region = process.env.NEXT_PUBLIC_AWS_S3_REGION
    const endpoint = process.env.NEXT_PUBLIC_AWS_S3_ENDPOINT
    const accessKeyId = process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID
    const accessKeySecret = process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_SECRET
    const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET
    const sessionToken = process.env.NEXT_PUBLIC_AWS_S3_SESSION_TOKEN ?? ""
    const forcePathStyle =
      process.env.NEXT_PUBLIC_AWS_S3_FORCE_PATH_STYLE === "true"

    if (!region || !endpoint || !accessKeyId || !accessKeySecret || !bucket) {
      return null
    }

    return {
      region,
      endpoint,
      accessKeyId,
      accessKeySecret,
      bucket,
      sessionToken,
      credentialScope: process.env.NEXT_PUBLIC_AWS_S3_CREDENTIAL_SCOPE,
      accountId: process.env.NEXT_PUBLIC_AWS_S3_ACCOUNT_ID,
      forcePathStyle,
    }
  }

  const buildAvatarUrl = (token: AwsS3Token, path: string) => {
    const normalizedEndpoint = token.endpoint.replace(/\/$/, "")
    const normalizedBucket = token.bucket.trim()
    const normalizedPath = path.replace(/^\//, "")

    if (forcePathStyleUrl(token)) {
      return `${normalizedEndpoint}/${normalizedBucket}/${normalizedPath}`
    }

    const endpointUrl = new URL(normalizedEndpoint)
    return `${endpointUrl.protocol}//${normalizedBucket}.${endpointUrl.host}/${normalizedPath}`
  }

  const forcePathStyleUrl = (token: AwsS3Token) => token.forcePathStyle

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

    const token = resolveAwsS3Token()
    if (!token) {
      toast.error("缺少 S3 上传配置，暂时无法上传头像")
      return
    }

    try {
      setIsUploadingAvatar(true)
      const folder = `avatars/users/${mode}/${values.username.trim() || "temporary"}`
      const result = await uploadFile(file, folder, token)
      const avatarUrl = buildAvatarUrl(token, result.path)
      handleFieldChange("avatar_url", avatarUrl)
      toast.success("头像上传成功")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "头像上传失败，请稍后重试"
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const avatarLabel =
    values.nickname.trim() || values.username.trim() || "用户头像预览"

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader className="border-b border-border/70 pb-4">
          <SheetTitle>{header.title}</SheetTitle>
          <SheetDescription>{header.description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            <section className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="size-14">
                    <AvatarImage src={values.avatar_url} alt={avatarLabel} />
                    <AvatarFallback>
                      {getUserAvatarFallback(values)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {avatarLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      头像、昵称和状态会直接影响列表中的识别效率。
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => void handleAvatarFileChange(event)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending || isUploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <UploadIcon />
                    )}
                    上传头像
                  </Button>
                </div>
              </div>
            </section>

            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="username">用户名</FieldLabel>
                  <FieldContent>
                    <Input
                      id="username"
                      value={values.username}
                      disabled={mode === "update"}
                      onChange={(event) =>
                        handleFieldChange("username", event.target.value)
                      }
                      placeholder="请输入用户名"
                    />
                    {mode === "update" ? (
                      <FieldDescription>
                        用户名创建后不可修改。
                      </FieldDescription>
                    ) : null}
                    <FieldError>{errors.username}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="nickname">昵称</FieldLabel>
                  <FieldContent>
                    <Input
                      id="nickname"
                      value={values.nickname}
                      onChange={(event) =>
                        handleFieldChange("nickname", event.target.value)
                      }
                      placeholder="用于列表主展示名称"
                    />
                    <FieldError>{errors.nickname}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">邮箱</FieldLabel>
                  <FieldContent>
                    <Input
                      id="email"
                      type="email"
                      value={values.email}
                      onChange={(event) =>
                        handleFieldChange("email", event.target.value)
                      }
                      placeholder="name@example.com"
                    />
                    <FieldError>{errors.email}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">手机号</FieldLabel>
                  <FieldContent>
                    <Input
                      id="phone"
                      value={values.phone}
                      onChange={(event) =>
                        handleFieldChange("phone", event.target.value)
                      }
                      placeholder="请输入手机号"
                    />
                    <FieldError>{errors.phone}</FieldError>
                  </FieldContent>
                </Field>

                {mode === "create" ? (
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="password">登录密码</FieldLabel>
                    <FieldContent>
                      <Input
                        id="password"
                        type="password"
                        value={values.password}
                        onChange={(event) =>
                          handleFieldChange("password", event.target.value)
                        }
                        placeholder="至少 8 位，保存前会做 bcrypt hash"
                      />
                      <FieldDescription>
                        仅创建时需要录入，提交前会在浏览器端转换为
                        `password_hash`。
                      </FieldDescription>
                      <FieldError>{errors.password}</FieldError>
                    </FieldContent>
                  </Field>
                ) : null}
              </div>

              <FieldSeparator>资料展示</FieldSeparator>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <Field>
                  <FieldLabel htmlFor="avatar_url">头像地址</FieldLabel>
                  <FieldContent>
                    <Input
                      id="avatar_url"
                      value={values.avatar_url}
                      onChange={(event) =>
                        handleFieldChange("avatar_url", event.target.value)
                      }
                      placeholder="https://example.com/avatar.png"
                      disabled={isUploadingAvatar}
                    />
                    <FieldDescription>
                      可直接粘贴图片地址，或使用上方“上传头像”将图片上传到 S3。
                    </FieldDescription>
                    <FieldError>{errors.avatar_url}</FieldError>
                  </FieldContent>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>性别</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(values.gender)}
                        onValueChange={(value) =>
                          handleFieldChange(
                            "gender",
                            Number(value) as 0 | 1 | 2
                          )
                        }
                      >
                        <SelectTrigger>
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
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>状态</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(values.status)}
                        onValueChange={(value) =>
                          handleFieldChange(
                            "status",
                            Number(value) as 0 | 1 | 2
                          )
                        }
                      >
                        <SelectTrigger>
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
                    </FieldContent>
                  </Field>
                </div>
              </div>

              <Field>
                <FieldLabel htmlFor="bio">个人简介</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="bio"
                    value={values.bio}
                    onChange={(event) =>
                      handleFieldChange("bio", event.target.value)
                    }
                    placeholder="补充用户的角色背景、团队归属或备注信息"
                    className="min-h-28"
                  />
                  <FieldDescription>
                    在长列表里，简短但有辨识度的备注更利于快速判断。
                  </FieldDescription>
                  <FieldError>{errors.bio}</FieldError>
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/70 pt-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {mode === "create" ? (
                <>
                  <UserRoundIcon className="size-3.5" />
                  创建后即可在列表中继续编辑和删除。
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="size-3.5" />
                  保存后会自动刷新列表数据。
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending || isUploadingAvatar}
              >
                取消
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={isPending || isUploadingAvatar}
              >
                {isPending ? <Loader2Icon className="animate-spin" /> : null}
                {header.submitLabel}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
