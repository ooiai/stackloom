"use client"

import { getDictDisplayName } from "@/components/base/dicts/helpers"
import { useEffect, useMemo } from "react"

import { DictMutateFormFields } from "@/components/base/dicts/dict-mutate-form-fields"
import { useDictMutateForm } from "@/components/base/dicts/hooks/use-dict-mutate-form"
import { DictMutateSheetHeader } from "@/components/base/dicts/dict-mutate-sheet-header"
import { DictMutateSheetFooter } from "@/components/base/dicts/dict-mutate-sheet-sections"
import { FieldGroup } from "@/components/ui/field"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { useI18n } from "@/providers/i18n-provider"
import type {
  DictData,
  DictFormValues,
  DictMutateMode,
} from "@/types/base.types"

interface DictMutateSheetProps {
  open: boolean
  mode: DictMutateMode
  dict: DictData | null
  parent: DictData | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: DictFormValues) => Promise<void>
}

export function DictMutateSheet({
  open,
  mode,
  dict,
  parent,
  isPending,
  onOpenChange,
  onSubmit,
}: DictMutateSheetProps) {
  const { t } = useI18n()
  const header =
    mode === "create"
      ? {
          title: t("dicts.sheet.create.title"),
          description: t("dicts.sheet.create.description"),
          submitLabel: t("dicts.sheet.create.submit"),
        }
      : {
          title: t("dicts.sheet.update.title"),
          description: t("dicts.sheet.update.description"),
          submitLabel: t("dicts.sheet.update.submit"),
        }

  const parentLabel = useMemo(() => {
    if (!parent) {
      return t("dicts.rootLabel")
    }

    return getDictDisplayName(parent)
  }, [parent, t])
  const { defaultValues, form } = useDictMutateForm({
    mode,
    dict,
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
      <SheetContent className="w-full sm:max-w-3xl">
        <DictMutateSheetHeader
          title={header.title}
          description={header.description}
        />

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <FieldGroup>
              <DictMutateFormFields
                form={form}
                mode={mode}
                hasParent={Boolean(parent)}
                parentLabel={parentLabel}
              />
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end">
            <DictMutateSheetFooter
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
