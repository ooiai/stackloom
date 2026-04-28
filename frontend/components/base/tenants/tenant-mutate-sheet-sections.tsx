"use client"

import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import { Loader2Icon } from "lucide-react"

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
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">{children}</div>
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
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">{children}</div>
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
