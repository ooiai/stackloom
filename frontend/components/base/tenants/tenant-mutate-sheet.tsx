"use client"

import { useEffect, useMemo } from "react"

import { TenantMutateFormFields } from "@/components/base/tenants/tenant-mutate-form-fields"
import { useTenantMutateForm } from "@/components/base/tenants/hooks/use-tenant-mutate-form"
import { TenantMutateSheetFooter } from "@/components/base/tenants/tenant-mutate-sheet-sections"
import { FieldGroup } from "@/components/ui/field"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { useI18n } from "@/providers/i18n-provider"
import type {
  TenantData,
  TenantFormValues,
  TenantMutateMode,
} from "@/types/base.types"

export function TenantMutateSheet({
  open,
  mode,
  tenant,
  parent,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  mode: TenantMutateMode
  tenant: TenantData | null
  parent: TenantData | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TenantFormValues) => Promise<void>
}) {
  const { t } = useI18n()
  const header =
    mode === "create"
      ? {
          title: t("tenants.sheet.create.title"),
          description: t("tenants.sheet.create.description"),
          submitLabel: t("tenants.sheet.create.submit"),
        }
      : {
          title: t("tenants.sheet.update.title"),
          description: t("tenants.sheet.update.description"),
          submitLabel: t("tenants.sheet.update.submit"),
        }

  const parentLabel = useMemo(() => {
    if (!parent) {
      return t("common.misc.rootDirectory")
    }

    return parent.name
  }, [parent, t])
  const { defaultValues, form } = useTenantMutateForm({
    mode,
    tenant,
    parent,
    onSubmit,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(defaultValues)
  }, [defaultValues, form, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset(defaultValues)
    }
    onOpenChange(nextOpen)
  }

  const handleCancel = () => {
    form.reset(defaultValues)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <div className="space-y-1 border-b border-border/60 px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">
            {header.title}
          </h3>
          <p className="text-sm text-muted-foreground">{header.description}</p>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <FieldGroup>
              <TenantMutateFormFields form={form} parentLabel={parentLabel} />
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 bg-muted/20 px-5 py-4">
            <TenantMutateSheetFooter
              isBusy={isPending || form.state.isSubmitting}
              submitLabel={header.submitLabel}
              onCancel={handleCancel}
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
