"use client"

import { useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SettingsIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getNameAbbr } from "@/lib/core"
import { invalidateHeaderSharedQueries } from "@/hooks/use-header-context"
import { useI18n } from "@/providers/i18n-provider"
import { userApi } from "@/stores/base-api"
import type { HeaderContextUserData, UpdateUserParam } from "@/types/base.types"

interface AccountSettingsDialogProps {
  user: HeaderContextUserData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function AccountSettingsDialogContent({
  user,
  onOpenChange,
  onSuccess,
}: Omit<AccountSettingsDialogProps, "open">) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [nickname, setNickname] = useState(user?.nickname ?? "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "")

  const normalizedNickname = nickname.trim()
  const normalizedAvatarUrl = avatarUrl.trim()
  const initialNickname = user?.nickname ?? ""
  const initialAvatarUrl = user?.avatar_url ?? ""
  const isDirty =
    normalizedNickname !== initialNickname ||
    normalizedAvatarUrl !== initialAvatarUrl

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) return

      const params: UpdateUserParam = {
        id: user.id,
        nickname: normalizedNickname || null,
        avatar_url: normalizedAvatarUrl || null,
      }

      await userApi.update(params)
    },
    onSuccess: async () => {
      await invalidateHeaderSharedQueries(queryClient)
      toast.success(t("account.settings.success"))
      onOpenChange(false)
      onSuccess?.()
    },
    onError: () => {
      toast.error(t("account.settings.error"))
    },
  })

  const handleSave = () => {
    if (!user || !isDirty) {
      return
    }

    updateMutation.mutate()
  }

  const username = user?.username ?? t("navigation.profile.fallbackName")
  const tenantName = user?.tenant_name ?? t("navigation.profile.fallbackMeta")
  const previewName = normalizedNickname || username
  const initials = getNameAbbr(previewName || "SL")
  const isSaveDisabled = !user || !isDirty || updateMutation.isPending
  const helperText = useMemo(() => t("account.settings.previewHint"), [t])

  return (
    <>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
      <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border/70 bg-background shadow-2xl outline-none">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <SettingsIcon className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                {t("account.settings.title")}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t("account.settings.subtitle")}
              </p>
            </div>
          </div>
          <DialogPrimitive.Close
            render={
              <button className="mt-0.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />
            }
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        </div>

        <div className="space-y-5 px-6 pb-6">
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
                  {username}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {tenantName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {helperText}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="avatarUrl" className="text-sm font-medium">
              {t("account.settings.avatar")}
            </label>
            <Input
              id="avatarUrl"
              placeholder={t("account.settings.avatarHint")}
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              disabled={updateMutation.isPending}
              inputMode="url"
            />
            <p className="text-xs text-muted-foreground">
              {t("account.settings.avatarHint")}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("account.settings.username")}
            </label>
            <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              {username}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="nickname" className="text-sm font-medium">
              {t("account.settings.nickname")}
            </label>
            <Input
              id="nickname"
              placeholder={t("account.settings.nicknamePlaceholder")}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/50 px-6 py-4">
          <DialogPrimitive.Close
            render={<Button type="button" variant="outline" />}
            disabled={updateMutation.isPending}
          >
            {t("account.settings.cancel")}
          </DialogPrimitive.Close>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="min-w-28 gap-2"
          >
            {updateMutation.isPending ? <Spinner className="size-4" /> : null}
            {updateMutation.isPending
              ? t("account.settings.loading")
              : t("account.settings.save")}
          </Button>
        </div>
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
  const dialogKey = `${user?.id ?? "anonymous"}:${user?.nickname ?? ""}:${user?.avatar_url ?? ""}`

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
