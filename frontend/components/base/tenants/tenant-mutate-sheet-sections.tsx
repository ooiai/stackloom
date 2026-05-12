"use client"

import type { ChangeEvent, KeyboardEvent, ReactNode, RefObject } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { resolveAwsObjectUrl } from "@/lib/aws"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import type { TenantFormValues } from "@/types/base.types"
import { CameraIcon, Loader2Icon } from "lucide-react"

interface LogoSectionProps {
  logoLabel: string
  values: TenantFormValues
  isUploadingLogo: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onLogoFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
}

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
    <div className={cn("space-y-1", className)}>
      <h3 className="text-sm leading-none font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="text-[12px] leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function TenantMutateLogoSection({
  logoLabel,
  values,
  isUploadingLogo,
  fileInputRef,
  onLogoFileChange,
}: LogoSectionProps) {
  const { t } = useI18n()
  const triggerFileInput = () => fileInputRef.current?.click()
  const logoSrc = resolveAwsObjectUrl(values.logo_url)

  const handleLogoKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      triggerFileInput()
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:border-border/80">
      <div className="flex flex-col items-start gap-5">
        <div className="flex items-center gap-4">
          <div
            className="group relative cursor-pointer rounded-full ring-offset-2 ring-offset-background transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
            role="button"
            tabIndex={0}
            aria-label={t("tenants.form.logo_url.change")}
            onClick={triggerFileInput}
            onKeyDown={handleLogoKeyDown}
          >
            <Avatar className="size-14 ring-2 ring-border/70 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary/60 sm:size-16">
              <AvatarImage src={logoSrc} alt={logoLabel} />
              <AvatarFallback className="bg-primary/5 text-base font-semibold text-primary/80">
                {logoLabel.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all duration-300 group-hover:bg-black/35">
              <CameraIcon className="size-5 translate-y-1 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
            </div>

            {isUploadingLogo ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-[1px]">
                <Loader2Icon className="size-6 animate-spin text-white" />
              </div>
            ) : null}
          </div>

          <div className="min-w-0 space-y-1.5">
            <h2 className="text-sm leading-tight font-semibold text-foreground sm:text-base">
              {logoLabel}
            </h2>
            <p className="max-w-xs text-[12px] leading-5 text-muted-foreground">
              {t("tenants.form.logo_url.label")}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void onLogoFileChange(event)}
        />
      </div>
    </section>
  )
}

export function TenantMutateBasicSection({
  children,
}: {
  children: ReactNode
}) {
  const { t } = useI18n()

  return (
    <section className="space-y-3">
      <SectionHeader
        title={t("tenants.sections.basic.title")}
        description={t("tenants.sections.basic.description")}
      />
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

export function TenantMutateSupplementSection({
  children,
}: {
  children: ReactNode
}) {
  const { t } = useI18n()

  return (
    <section className="space-y-3">
      <SectionHeader
        title={t("tenants.sections.supplement.title")}
        description={t("tenants.sections.supplement.description")}
      />
      {/*<div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">{children}</div>*/}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

export function TenantMutateSheetFooter({
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
        className="h-9 w-full text-[13px] sm:w-auto"
        onClick={onCancel}
        disabled={isBusy}
      >
        {t("common.actions.cancel")}
      </Button>
      <Button
        type="submit"
        className="h-9 w-full gap-2 text-[13px] sm:w-auto"
        disabled={isBusy}
      >
        {isBusy ? <Loader2Icon className="size-3.5 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </div>
  )
}
