"use client"

import { type ChangeEvent, useMemo, useRef, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CameraIcon, Loader2Icon, SettingsIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAwsS3 } from "@/hooks/use-aws-s3"
import { invalidateHeaderSharedQueries } from "@/hooks/use-header-context"
import { uploadAwsObject } from "@/lib/aws"
import { OSS_ENUM } from "@/lib/config/enums"
import { getNameAbbr } from "@/lib/core"
import { useI18n } from "@/providers/i18n-provider"
import { profileApi } from "@/stores/base-api"
import { awsApi } from "@/stores/system-api"
import type { HeaderContextUserData, UserProfileData } from "@/types/base.types"

interface AccountSettingsDialogProps {
  user: HeaderContextUserData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const ACCOUNT_PROFILE_QUERY_KEY = ["shared", "profile", "self"] as const

function normalizeNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function buildFallbackProfile(user: HeaderContextUserData | null): UserProfileData | null {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    nickname: user.nickname,
    avatar_url: user.avatar_url,
    display_name: user.display_name,
    employee_no: user.employee_no,
    job_title: user.job_title,
    tenant_id: user.tenant_id,
    tenant_name: user.tenant_name,
  }
}

function AccountSettingsDialogForm({
  profile,
  onOpenChange,
  onSuccess,
}: {
  profile: UserProfileData
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { uploadFile } = useAwsS3()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [nickname, setNickname] = useState(profile.nickname ?? "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "")
  const [email, setEmail] = useState(profile.email ?? "")
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [displayName, setDisplayName] = useState(profile.display_name ?? "")
  const [employeeNo, setEmployeeNo] = useState(profile.employee_no ?? "")
  const [jobTitle, setJobTitle] = useState(profile.job_title ?? "")

  const normalizedNickname = normalizeNullable(nickname)
  const normalizedAvatarUrl = normalizeNullable(avatarUrl)
  const normalizedEmail = normalizeNullable(email)
  const normalizedPhone = normalizeNullable(phone)
  const normalizedDisplayName = normalizeNullable(displayName)
  const normalizedEmployeeNo = normalizeNullable(employeeNo)
  const normalizedJobTitle = normalizeNullable(jobTitle)
  const isDirty =
    normalizedNickname !== profile.nickname ||
    normalizedAvatarUrl !== profile.avatar_url ||
    normalizedEmail !== profile.email ||
    normalizedPhone !== profile.phone ||
    normalizedDisplayName !== profile.display_name ||
    normalizedEmployeeNo !== profile.employee_no ||
    normalizedJobTitle !== profile.job_title

  const updateMutation = useMutation({
    mutationFn: async () =>
      profileApi.update({
        email: normalizedEmail,
        phone: normalizedPhone,
        nickname: normalizedNickname,
        avatar_url: normalizedAvatarUrl,
        display_name: normalizedDisplayName,
        employee_no: normalizedEmployeeNo,
        job_title: normalizedJobTitle,
      }),
    onSuccess: async () => {
      await Promise.all([
        invalidateHeaderSharedQueries(queryClient),
        queryClient.invalidateQueries({
          queryKey: [...ACCOUNT_PROFILE_QUERY_KEY],
        }),
      ])
      toast.success(t("account.settings.success"))
      onOpenChange(false)
      onSuccess?.()
    },
    onError: () => {
      toast.error(t("account.settings.error"))
    },
  })

  const handleAvatarFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error(t("account.settings.avatarInvalid"))
      return
    }

    try {
      setIsUploadingAvatar(true)
      const url = await uploadAwsObject({
        file,
        folder: OSS_ENUM.IMAGES,
        uploadFile,
        getSts: () => awsApi.getSts({}),
      })
      setAvatarUrl(url)
      toast.success(t("account.settings.avatarUploaded"))
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("account.settings.avatarUploadFailed")
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const previewName =
    normalizedDisplayName || normalizedNickname || profile.username
  const initials = getNameAbbr(previewName || "SL")
  const isBusy = updateMutation.isPending || isUploadingAvatar
  const isSaveDisabled = !isDirty || isBusy

  return (
    <form
      className="space-y-5 px-6 pb-6"
      onSubmit={(event) => {
        event.preventDefault()
        if (isSaveDisabled) {
          return
        }
        updateMutation.mutate()
      }}
    >
      <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-border/50">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          {t("account.settings.previewTitle")}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar className="size-14">
            {normalizedAvatarUrl && (
              <AvatarImage src={normalizedAvatarUrl} alt={previewName} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {previewName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.username}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {profile.tenant_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("account.settings.avatar")}</label>
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploadingAvatar ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <CameraIcon className="size-3.5" />
            )}
            {isUploadingAvatar
              ? t("account.settings.avatarUploading")
              : t("account.settings.avatarUpload")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("account.settings.avatarHint")}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleAvatarFileChange(event)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("account.settings.company")}
          </label>
          <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
            {profile.tenant_name}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("account.settings.username")}
          </label>
          <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
            {profile.username}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="nickname" className="text-sm font-medium">
            {t("account.settings.nickname")}
          </label>
          <Input
            id="nickname"
            placeholder={t("account.settings.nicknamePlaceholder")}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            disabled={isBusy}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium">
            {t("account.settings.displayName")}
          </label>
          <Input
            id="displayName"
            placeholder={t("account.settings.displayNamePlaceholder")}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={isBusy}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {t("account.settings.email")}
          </label>
          <Input
            id="email"
            placeholder={t("account.settings.emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isBusy}
            inputMode="email"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            {t("account.settings.phone")}
          </label>
          <Input
            id="phone"
            placeholder={t("account.settings.phonePlaceholder")}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={isBusy}
            inputMode="tel"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="employeeNo" className="text-sm font-medium">
            {t("account.settings.employeeNo")}
          </label>
          <Input
            id="employeeNo"
            placeholder={t("account.settings.employeeNoPlaceholder")}
            value={employeeNo}
            onChange={(event) => setEmployeeNo(event.target.value)}
            disabled={isBusy}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="jobTitle" className="text-sm font-medium">
            {t("account.settings.jobTitle")}
          </label>
          <Input
            id="jobTitle"
            placeholder={t("account.settings.jobTitlePlaceholder")}
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            disabled={isBusy}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border/50 pt-4">
        <DialogPrimitive.Close
          render={<Button type="button" variant="outline" />}
          disabled={isBusy}
        >
          {t("account.settings.cancel")}
        </DialogPrimitive.Close>
        <Button type="submit" disabled={isSaveDisabled} className="min-w-28 gap-2">
          {updateMutation.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          {updateMutation.isPending
            ? t("account.settings.loading")
            : t("account.settings.save")}
        </Button>
      </div>
    </form>
  )
}

function AccountSettingsDialogContent({
  user,
  onOpenChange,
  onSuccess,
}: Omit<AccountSettingsDialogProps, "open">) {
  const { t } = useI18n()
  const fallbackProfile = buildFallbackProfile(user)
  const profileQuery = useQuery({
    queryKey: [...ACCOUNT_PROFILE_QUERY_KEY],
    queryFn: () => profileApi.get(),
  })

  const profile = profileQuery.data ?? fallbackProfile
  const profileKey = useMemo(
    () =>
      profile
        ? [
            profile.id,
            profile.email ?? "",
            profile.phone ?? "",
            profile.nickname ?? "",
            profile.avatar_url ?? "",
            profile.display_name ?? "",
            profile.employee_no ?? "",
            profile.job_title ?? "",
            profile.tenant_name,
          ].join(":")
        : "profile-empty",
    [profile]
  )
  const isProfileBusy = profileQuery.isPending && !profile

  return (
    <>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
      <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border/70 bg-background shadow-2xl outline-none">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <SettingsIcon className="size-5 text-primary" />
            </div>
            <div>
              <DialogPrimitive.Title className="text-base font-semibold">
                {t("account.settings.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                {t("account.settings.subtitle")}
              </DialogPrimitive.Description>
            </div>
          </div>
          <DialogPrimitive.Close
            render={
              <button className="mt-0.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />
            }
            disabled={isProfileBusy}
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        </div>

        {isProfileBusy ? (
          <div className="flex items-center gap-2 px-6 pb-6 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            {t("account.settings.loading")}
          </div>
        ) : profile ? (
          <AccountSettingsDialogForm
            key={profileKey}
            profile={profile}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : (
          <div className="space-y-3 px-6 pb-6">
            <p className="text-sm text-muted-foreground">{t("account.settings.error")}</p>
            <div className="flex justify-end">
              <DialogPrimitive.Close render={<Button type="button" variant="outline" />}>
                {t("account.settings.cancel")}
              </DialogPrimitive.Close>
            </div>
          </div>
        )}
      </DialogPrimitive.Popup>
    </>
  )
}

export function AccountSettingsDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: AccountSettingsDialogProps) {
  const dialogKey = `${user?.id ?? "anonymous"}:${open ? "open" : "closed"}`

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {open ? (
          <AccountSettingsDialogContent
            key={dialogKey}
            user={user}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
