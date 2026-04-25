"use client"

import {
  type ChangeEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react"
import { CameraIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
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
import { useAwsS3, type AwsS3Token } from "@/hooks/use-aws-s3"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import { Textarea } from "@/components/reui/textarea"
import { buildAwsObjectUrl, mapStsToAwsS3Token } from "@/lib/aws"
import { OSS_ENUM } from "@/lib/config/enums"
import {
  USER_GENDER_OPTIONS,
  USER_STATUS_OPTIONS,
  getDefaultUserFormValues,
  getUserAvatarFallback,
  getUserDisplayName,
  validateUserForm,
} from "@/lib/users"
import { awsApi } from "@/stores/system-api"
import type {
  UserData,
  UserFormValues,
  UserMutateMode,
} from "@/types/base.types"
import { cn } from "@/lib/utils"

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

interface UserMutateSheetShellProps {
  open: boolean
  header: UserMutateSheetHeader
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

interface AvatarUploadSectionProps {
  avatarLabel: string
  avatarUrl: string
  values: UserFormValues
  status: UserFormValues["status"]
  isPending: boolean
  isUploadingAvatar: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
}

interface AccountFieldsSectionProps {
  mode: UserMutateMode
  values: UserFormValues
  errors: Partial<Record<keyof UserFormValues, string>>
  showPassword: boolean
  onTogglePassword: () => void
  onFieldChange: <T extends keyof UserFormValues>(
    key: T,
    value: UserFormValues[T]
  ) => void
}

interface ProfileFieldsSectionProps {
  values: UserFormValues
  errors: Partial<Record<keyof UserFormValues, string>>
  isUploadingAvatar: boolean
  onFieldChange: <T extends keyof UserFormValues>(
    key: T,
    value: UserFormValues[T]
  ) => void
}

interface BioSectionProps {
  values: UserFormValues
  errors: Partial<Record<keyof UserFormValues, string>>
  onFieldChange: <T extends keyof UserFormValues>(
    key: T,
    value: UserFormValues[T]
  ) => void
}

interface SheetFooterActionsProps {
  mode: UserMutateMode
  isPending: boolean
  isUploadingAvatar: boolean
  submitLabel: string
  onCancel: () => void
  onSubmit: () => void
}

const fieldLabelClassName =
  "text-[13px] font-semibold leading-5 text-foreground/80"
const fieldContentClassName = "gap-2"

function SectionHeader({
  title,
  description,
  className,
}: {
  title: string
  description: string
  className?: string
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="mt-1.5 h-5 w-1 shrink-0 rounded-full bg-primary/80" />
      <div className="min-w-0 space-y-1">
        <h3 className="text-sm leading-none font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-[13px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function getUserMutateSheetHeader(mode: UserMutateMode): UserMutateSheetHeader {
  if (mode === "create") {
    return {
      title: "新增用户",
      description: "录入基础信息并创建用户。",
      submitLabel: "创建用户",
    }
  }

  return {
    title: "编辑用户",
    description: "维护当前用户资料。",
    submitLabel: "保存变更",
  }
}

async function uploadUserAvatar({
  file,
  uploadFile,
}: {
  file: File
  uploadFile: ReturnType<typeof useAwsS3>["uploadFile"]
}) {
  const sts = await awsApi.getSts({})
  const token: AwsS3Token = mapStsToAwsS3Token(sts)
  const result = await uploadFile(file, OSS_ENUM.IMAGES, token)

  return buildAwsObjectUrl(token, result.path)
}

function UserMutateSheetShell({
  open,
  header,
  onOpenChange,
  children,
}: UserMutateSheetShellProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-184">
        <SheetHeader className="border-b border-border/60 pb-5">
          <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
            {header.title}
          </SheetTitle>
          <SheetDescription className="max-w-xl text-sm leading-6 text-muted-foreground/70">
            {header.description}
          </SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}

function AvatarUploadSection({
  avatarLabel,
  avatarUrl,
  values,
  status,
  isPending,
  isUploadingAvatar,
  fileInputRef,
  onAvatarFileChange,
}: AvatarUploadSectionProps) {
  const triggerFileInput = () => fileInputRef.current?.click()

  const handleAvatarKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      triggerFileInput()
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-5 transition-colors hover:border-border/80">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
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
              <AvatarImage src={avatarUrl} alt={avatarLabel} />
              <AvatarFallback className="bg-primary/5 text-base font-semibold text-primary/80">
                {getUserAvatarFallback(values)}
              </AvatarFallback>
            </Avatar>

            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all duration-300 group-hover:bg-black/35">
              <CameraIcon className="size-5 translate-y-1 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
            </div>

            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-[1px]">
                <Loader2Icon className="size-6 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base leading-tight font-semibold text-foreground">
                {avatarLabel}
              </h2>
            </div>
            <p className="max-w-xs text-[13px] leading-5 text-muted-foreground">
              支持上传图片或填写链接
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function AccountFieldsSection({
  mode,
  values,
  errors,
  showPassword,
  onTogglePassword,
  onFieldChange,
}: AccountFieldsSectionProps) {
  return (
    <div className="w-full space-y-5">
      <SectionHeader title="账户信息" description="维护账号标识与联系方式。" />

      <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
        <Field>
          <FieldLabel className={fieldLabelClassName} htmlFor="username">
            用户名
          </FieldLabel>
          <FieldContent className={fieldContentClassName}>
            <Input
              id="username"
              value={values.username}
              disabled={mode === "update"}
              onChange={(event) =>
                onFieldChange("username", event.target.value)
              }
              placeholder="请输入用户名"
              className={cn(
                "transition-colors",
                mode === "update" &&
                  "cursor-not-allowed bg-muted/50 text-muted-foreground"
              )}
            />
            <FieldError>{errors.username}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel className={fieldLabelClassName} htmlFor="nickname">
            昵称
          </FieldLabel>
          <FieldContent className={fieldContentClassName}>
            <Input
              id="nickname"
              value={values.nickname}
              onChange={(event) =>
                onFieldChange("nickname", event.target.value)
              }
              placeholder="展示名称"
            />
            <FieldError>{errors.nickname}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel className={fieldLabelClassName} htmlFor="email">
            邮箱
          </FieldLabel>
          <FieldContent className={fieldContentClassName}>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
              placeholder="name@example.com"
            />
            <FieldError>{errors.email}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel className={fieldLabelClassName} htmlFor="phone">
            手机号
          </FieldLabel>
          <FieldContent className={fieldContentClassName}>
            <Input
              id="phone"
              type="tel"
              value={values.phone}
              onChange={(event) => onFieldChange("phone", event.target.value)}
              placeholder="请输入手机号"
            />
            <FieldError>{errors.phone}</FieldError>
          </FieldContent>
        </Field>

        {mode === "create" && (
          <Field className="md:col-span-2">
            <FieldLabel className={fieldLabelClassName} htmlFor="password">
              登录密码
            </FieldLabel>
            <FieldContent className={fieldContentClassName}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(event) =>
                    onFieldChange("password", event.target.value)
                  }
                  placeholder="建议设置不少于 8 位字符"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={onTogglePassword}
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
              <FieldError>{errors.password}</FieldError>
            </FieldContent>
          </Field>
        )}
      </div>
    </div>
  )
}

function ProfileFieldsSection({
  values,
  errors,
  isUploadingAvatar,
  onFieldChange,
}: ProfileFieldsSectionProps) {
  return (
    <>
      <SectionHeader title="展示信息" description="维护展示信息与账号状态。" />

      <div className="space-y-5">
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field>
            <FieldLabel className={fieldLabelClassName}>性别</FieldLabel>
            <FieldContent className={fieldContentClassName}>
              <Select
                value={String(values.gender)}
                onValueChange={(value) =>
                  onFieldChange("gender", Number(value) as 0 | 1 | 2)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel className={fieldLabelClassName}>状态</FieldLabel>
            <FieldContent className={fieldContentClassName}>
              <Select
                value={String(values.status)}
                onValueChange={(value) =>
                  onFieldChange("status", Number(value) as 0 | 1 | 2)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </div>
      </div>
    </>
  )
}

function BioSection({ values, errors, onFieldChange }: BioSectionProps) {
  const bioLength = values.bio.trim().length

  return (
    <>
      <SectionHeader title="补充说明" description="补充业务属性与备注信息。" />

      <Field>
        <FieldLabel className={fieldLabelClassName} htmlFor="bio">
          个人简介
        </FieldLabel>
        <FieldContent className={fieldContentClassName}>
          <Textarea
            id="bio"
            value={values.bio}
            onChange={(event) => onFieldChange("bio", event.target.value)}
            placeholder="补充用户的角色背景、团队归属或备注信息"
            className="min-h-28 resize-y"
          />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span />
            <span
              className={cn(
                "text-xs tabular-nums transition-colors",
                bioLength > 1800 ? "text-amber-500" : "text-muted-foreground"
              )}
            >
              {bioLength}/2000
            </span>
          </div>
          <FieldError>{errors.bio}</FieldError>
        </FieldContent>
      </Field>
    </>
  )
}

function SheetFooterActions({
  mode,
  isPending,
  isUploadingAvatar,
  submitLabel,
  onCancel,
  onSubmit,
}: SheetFooterActionsProps) {
  return (
    <SheetFooter className="border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs text-muted-foreground sm:max-w-[60%]"></div>

      <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full rounded-lg text-[13px] sm:w-auto"
          onClick={onCancel}
          disabled={isPending || isUploadingAvatar}
        >
          取消
        </Button>
        <Button
          type="button"
          className="h-9 w-full gap-2 rounded-lg bg-primary text-[13px] shadow-sm transition-all hover:bg-primary/90 hover:shadow-md sm:w-auto"
          onClick={onSubmit}
          disabled={isPending || isUploadingAvatar}
        >
          {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </SheetFooter>
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
  const [values, setValues] = useState<UserFormValues>(
    getDefaultUserFormValues(user)
  )
  const [errors, setErrors] = useState<
    Partial<Record<keyof UserFormValues, string>>
  >({})
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const header = useMemo(() => getUserMutateSheetHeader(mode), [mode])

  const handleFieldChange = <T extends keyof UserFormValues>(
    key: T,
    value: UserFormValues[T]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const resetFormState = () => {
    setValues(getDefaultUserFormValues(user))
    setErrors({})
    setIsUploadingAvatar(false)
    setShowPassword(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetFormState()
    }

    onOpenChange(nextOpen)
  }

  const handleCancel = () => {
    resetFormState()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    const nextErrors = validateUserForm(mode, values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    await onSubmit(values)
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
      const avatarUrl = await uploadUserAvatar({
        file,
        uploadFile,
      })
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

  const avatarLabel = useMemo(
    () =>
      getUserDisplayName({
        nickname: values.nickname,
        username: values.username || "用户头像",
      }) || "用户头像",
    [values.nickname, values.username]
  )

  return (
    <UserMutateSheetShell
      open={open}
      header={header}
      onOpenChange={handleOpenChange}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-6 overflow-y-auto px-5 pt-2 pb-6">
          <AvatarUploadSection
            avatarLabel={avatarLabel}
            avatarUrl={values.avatar_url}
            values={values}
            status={values.status}
            isPending={isPending}
            isUploadingAvatar={isUploadingAvatar}
            fileInputRef={fileInputRef}
            onAvatarFileChange={handleAvatarFileChange}
          />

          <FieldGroup>
            <AccountFieldsSection
              mode={mode}
              values={values}
              errors={errors}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              onFieldChange={handleFieldChange}
            />

            <FieldSeparator className="-my-1.5" />

            <ProfileFieldsSection
              values={values}
              errors={errors}
              isUploadingAvatar={isUploadingAvatar}
              onFieldChange={handleFieldChange}
            />

            <FieldSeparator className="-my-1.5" />

            <BioSection
              values={values}
              errors={errors}
              onFieldChange={handleFieldChange}
            />
          </FieldGroup>
        </div>

        <SheetFooterActions
          mode={mode}
          isPending={isPending}
          isUploadingAvatar={isUploadingAvatar}
          submitLabel={header.submitLabel}
          onCancel={handleCancel}
          onSubmit={() => void handleSubmit()}
        />
      </div>
    </UserMutateSheetShell>
  )
}
