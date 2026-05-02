"use client"

import { useEffect, useMemo } from "react"

import { RoleMutateFormFields } from "@/components/base/roles/role-mutate-form-fields"
import { useRoleMutateForm } from "@/components/base/roles/hooks/use-role-mutate-form"
import { RoleMutateSheetHeader } from "@/components/base/roles/role-mutate-sheet-header"
import { RoleMutateSheetFooter } from "@/components/base/roles/role-mutate-sheet-sections"
import { FieldGroup } from "@/components/ui/field"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { useI18n } from "@/providers/i18n-provider"
import type {
  RoleData,
  RoleFormValues,
  RoleMutateMode,
} from "@/types/base.types"

interface RoleMutateSheetProps {
  open: boolean
  mode: RoleMutateMode
  role: RoleData | null
  parent: RoleData | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RoleFormValues) => Promise<void>
}

type RoleSubmitError = {
  code?: number
  message?: string
}

const normalizeErrorMessage = (error: unknown): string => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as RoleSubmitError).message ?? "")
      : error instanceof Error
        ? error.message
        : ""

  return message.replace(/^[A-Za-z ]+:\s*/, "").replace(/^.*?:\d+\s+/, "").trim()
}

export function RoleMutateSheet({
  open,
  mode,
  role,
  parent,
  isPending,
  onOpenChange,
  onSubmit,
}: RoleMutateSheetProps) {
  const { t } = useI18n()
  const header =
    mode === "create"
      ? {
          title: t("roles.sheet.create.title"),
          description: t("roles.sheet.create.description"),
          submitLabel: t("roles.sheet.create.submit"),
        }
      : {
          title: t("roles.sheet.update.title"),
          description: t("roles.sheet.update.description"),
          submitLabel: t("roles.sheet.update.submit"),
        }

  const parentLabel = useMemo(() => {
    if (!parent) {
      return t("common.misc.rootDirectory")
    }

    return parent.name
  }, [parent, t])
  const { defaultValues, form } = useRoleMutateForm({
    mode,
    role,
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
        <RoleMutateSheetHeader
          title={header.title}
          description={header.description}
        />

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit().catch((error: unknown) => {
              const message = normalizeErrorMessage(error)
              if (message.includes("role code already exists")) {
                form.setFieldMeta("code", (prev) => ({
                  ...prev,
                  isTouched: true,
                  errors: [t("roles.form.code.validation.duplicate")],
                }))
                return
              }

            })
          }}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <FieldGroup>
              <RoleMutateFormFields form={form} parentLabel={parentLabel} />
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 px-5 py-4 sm:flex-row sm:justify-end">
            <RoleMutateSheetFooter
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
