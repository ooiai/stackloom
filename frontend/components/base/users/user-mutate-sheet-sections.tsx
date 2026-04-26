"use client"

import type { ChangeEvent, KeyboardEvent, ReactNode, RefObject } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getUserAvatarFallback } from "@/lib/users"
import { useI18n } from "@/providers/i18n-provider"
import type { UserFormValues } from "@/types/base.types"
import { CameraIcon, Loader2Icon } from "lucide-react"

interface SectionHeaderProps {
  title: string
  description: string
  className?: string
}

interface AvatarSectionProps {
  avatarLabel: string
  values: UserFormValues
  isUploadingAvatar: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
}

export function SectionHeader({
  title,
  description,
  className,
}: SectionHeaderProps) {
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

export function UserMutateAvatarSection({
  avatarLabel,
  values,
  isUploadingAvatar,
  fileInputRef,
  onAvatarFileChange,
}: AvatarSectionProps) {
  const { t } = useI18n()
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
            aria-label={t("users.avatar.change")}
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
              {t("users.avatar.hint")}
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

export function UserMutateAccountSection({
  children,
}: {
  children: ReactNode
}) {
  const { t } = useI18n()
  return (
    <section className="w-full space-y-5">
      <SectionHeader
        title={t("users.sections.account.title")}
        description={t("users.sections.account.description")}
      />
      <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

export function UserMutateProfileSection({
  children,
}: {
  children: ReactNode
}) {
  const { t } = useI18n()
  return (
    <section className="space-y-5">
      <SectionHeader
        title={t("users.sections.profile.title")}
        description={t("users.sections.profile.description")}
      />
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function UserMutateSheetFooter({
  isBusy,
  submitLabel,
  onCancel,
}: {
  isBusy: boolean
  submitLabel: string
  onCancel: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full rounded-lg text-[13px] sm:w-auto"
        onClick={onCancel}
        disabled={isBusy}
      >
        {t("common.actions.cancel")}
      </Button>
      <Button
        type="submit"
        className="h-9 w-full gap-2 rounded-lg bg-primary text-[13px] shadow-sm transition-all hover:bg-primary/90 hover:shadow-md sm:w-auto"
        disabled={isBusy}
      >
        {isBusy ? <Loader2Icon className="size-3.5 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </div>
  )
}
