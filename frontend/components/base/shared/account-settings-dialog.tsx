"use client"

import { useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useMutation } from "@tanstack/react-query"
import { SettingsIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { getNameAbbr } from "@/lib/core"
import { useI18n } from "@/providers/i18n-provider"
import { userApi } from "@/stores/base-api"
import type { HeaderContextUserData, UpdateUserParam } from "@/types/base.types"

interface AccountSettingsDialogProps {
  user: HeaderContextUserData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AccountSettingsDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: AccountSettingsDialogProps) {
  const { t } = useI18n()
  const [nickname, setNickname] = useState(user?.nickname ?? "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "")

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      const params: UpdateUserParam = {
        id: user.id,
        nickname: nickname || null,
        avatar_url: avatarUrl || null,
      }
      await userApi.update(params)
    },
    onSuccess: () => {
      toast.success(t("account.settings.success"))
      onOpenChange(false)
      onSuccess?.()
    },
    onError: () => {
      toast.error(t("account.settings.error"))
    },
  })

  const handleSave = () => {
    updateMutation.mutate()
  }

  const displayName = user?.nickname ?? user?.username ?? t("navigation.profile.fallbackName")
  const initials = getNameAbbr(displayName || "SL")

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border/70 bg-background shadow-2xl outline-none">
          {/* Header */}
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

          {/* Body */}
          <div className="space-y-4 px-6 pb-6">
            {/* Avatar Preview + Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("account.settings.avatar")}</label>
              <div className="flex items-end gap-4">
                <div className="flex size-16 items-center justify-center rounded-lg bg-muted ring-1 ring-border/40">
                  <Avatar className="size-14">
                    {avatarUrl && (
                      <AvatarImage src={avatarUrl} alt={displayName} />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <Input
                  placeholder={t("account.settings.avatarHint")}
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  disabled={updateMutation.isPending}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("account.settings.avatarHint")}
              </p>
            </div>

            {/* Username (Read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("account.settings.username")}</label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                {user?.username}
              </div>
            </div>

            {/* Nickname (Editable) */}
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                {t("account.settings.nickname")}
              </label>
              <Input
                id="nickname"
                placeholder={t("account.settings.nicknamePlaceholder")}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-6 pb-6">
            <DialogPrimitive.Close
              render={
                <button
                  className={cn(
                    "flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50",
                    updateMutation.isPending && "pointer-events-none opacity-50"
                  )}
                />
              }
            >
              {t("account.settings.cancel")}
            </DialogPrimitive.Close>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 gap-2"
            >
              {updateMutation.isPending && <Spinner className="size-4" />}
              {updateMutation.isPending
                ? t("account.settings.loading")
                : t("account.settings.save")}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
