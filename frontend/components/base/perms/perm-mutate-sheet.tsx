"use client"

import { useEffect } from "react"

import { PermMutateFormFields } from "@/components/base/perms/perm-mutate-form-fields"
import type { PermTreeNode } from "@/components/base/perms/helpers"
import { usePermMutateForm } from "@/components/base/perms/hooks/use-perm-mutate-form"
import { PermMutateSheetHeader } from "@/components/base/perms/perm-mutate-sheet-header"
import { PermMutateSheetFooter } from "@/components/base/perms/perm-mutate-sheet-sections"
import { FieldGroup } from "@/components/ui/field"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { useI18n } from "@/providers/i18n-provider"
import type {
  PermData,
  PermFormValues,
  PermMutateMode,
} from "@/types/base.types"

interface PermMutateSheetProps {
  open: boolean
  mode: PermMutateMode
  perm: PermData | null
  parent: PermData | null
  parentTree: PermTreeNode[]
  isParentTreeLoading: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PermFormValues) => Promise<void>
}

type PermSubmitError = {
  code?: number
  message?: string
}

const normalizeErrorMessage = (error: unknown): string => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as PermSubmitError).message ?? "")
      : error instanceof Error
        ? error.message
        : ""

  return message.replace(/^[A-Za-z ]+:\s*/, "").replace(/^.*?:\d+\s+/, "").trim()
}

export function PermMutateSheet({
  open,
  mode,
  perm,
  parent,
  parentTree,
  isParentTreeLoading,
  isPending,
  onOpenChange,
  onSubmit,
}: PermMutateSheetProps) {
  const { t } = useI18n()
  const header =
    mode === "create"
      ? {
          title: t("perms.sheet.create.title"),
          description: t("perms.sheet.create.description"),
          submitLabel: t("perms.sheet.create.submit"),
        }
      : mode === "copy"
        ? {
            title: t("perms.sheet.copy.title"),
            description: t("perms.sheet.copy.description"),
            submitLabel: t("perms.sheet.copy.submit"),
          }
        : {
            title: t("perms.sheet.update.title"),
            description: t("perms.sheet.update.description"),
            submitLabel: t("perms.sheet.update.submit"),
          }

  const { defaultValues, form } = usePermMutateForm({
    mode,
    perm,
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
        <PermMutateSheetHeader
          title={header.title}
          description={header.description}
        />

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit().catch((error: unknown) => {
              const message = normalizeErrorMessage(error)
              if (message.includes("perm code already exists")) {
                form.setFieldMeta("code", (prev) => ({
                  ...prev,
                  isTouched: true,
                  errors: [t("perms.form.code.validation.duplicate")],
                }))
                return
              }

            })
          }}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <FieldGroup>
              <PermMutateFormFields
                form={form}
                parent={parent}
                parentTree={parentTree}
                isParentTreeLoading={isParentTreeLoading}
              />
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 px-5 py-4 sm:flex-row sm:justify-end">
            <PermMutateSheetFooter
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
