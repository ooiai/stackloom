"use client"

import { useEffect, useMemo } from "react"

import { MenuMutateFormFields } from "@/components/base/menus/menu-mutate-form-fields"
import { useMenuMutateForm } from "@/components/base/menus/hooks/use-menu-mutate-form"
import { MenuMutateSheetHeader } from "@/components/base/menus/menu-mutate-sheet-header"
import { MenuMutateSheetFooter } from "@/components/base/menus/menu-mutate-sheet-sections"
import { FieldGroup } from "@/components/ui/field"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { useI18n } from "@/providers/i18n-provider"
import type {
  MenuData,
  MenuFormValues,
  MenuMutateMode,
} from "@/types/base.types"

interface MenuMutateSheetProps {
  open: boolean
  mode: MenuMutateMode
  menu: MenuData | null
  parent: MenuData | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: MenuFormValues) => Promise<void>
}

type MenuSubmitError = {
  code?: number
  message?: string
}

const normalizeErrorMessage = (error: unknown): string => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as MenuSubmitError).message ?? "")
      : error instanceof Error
        ? error.message
        : ""

  return message.replace(/^[A-Za-z ]+:\s*/, "").replace(/^.*?:\d+\s+/, "").trim()
}

export function MenuMutateSheet({
  open,
  mode,
  menu,
  parent,
  isPending,
  onOpenChange,
  onSubmit,
}: MenuMutateSheetProps) {
  const { t } = useI18n()
  const header =
    mode === "create"
      ? {
          title: t("menus.sheet.create.title"),
          description: t("menus.sheet.create.description"),
          submitLabel: t("menus.sheet.create.submit"),
        }
      : mode === "copy"
        ? {
            title: t("menus.sheet.copy.title"),
            description: t("menus.sheet.copy.description"),
            submitLabel: t("menus.sheet.copy.submit"),
          }
        : {
            title: t("menus.sheet.update.title"),
            description: t("menus.sheet.update.description"),
            submitLabel: t("menus.sheet.update.submit"),
          }

  const parentLabel = useMemo(() => {
    if (!parent) {
      return t("common.misc.rootDirectory")
    }

    return parent.name
  }, [parent, t])
  const { defaultValues, form } = useMenuMutateForm({
    mode,
    menu,
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
        <MenuMutateSheetHeader
          title={header.title}
          description={header.description}
        />

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit().catch((error: unknown) => {
              const message = normalizeErrorMessage(error)
              if (message.includes("menu code already exists")) {
                form.setFieldMeta("code", (prev) => ({
                  ...prev,
                  isTouched: true,
                  errors: [t("menus.form.code.validation.duplicate")],
                }))
                return
              }

            })
          }}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <FieldGroup>
              <MenuMutateFormFields form={form} parentLabel={parentLabel} />
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 px-5 py-4 sm:flex-row sm:justify-end">
            <MenuMutateSheetFooter
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
