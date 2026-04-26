"use client"

import { useMemo } from "react"

import { DictMutateFormFields } from "@/components/base/dicts/dict-mutate-form-fields"
import { useDictMutateForm } from "@/components/base/dicts/hooks/use-dict-mutate-form"
import { DictMutateSheetHeader } from "@/components/base/dicts/dict-mutate-sheet-header"
import { DictMutateSheetFooter } from "@/components/base/dicts/dict-mutate-sheet-sections"
import { FieldGroup } from "@/components/ui/field"
import { getDictDisplayName } from "@/lib/dicts"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
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

const SHEET_HEADER_MAP: Record<
  DictMutateMode,
  { title: string; description: string; submitLabel: string }
> = {
  create: {
    title: "新增字典项",
    description: "维护字典树节点、值类型与业务展示文案。",
    submitLabel: "创建字典项",
  },
  update: {
    title: "编辑字典项",
    description: "更新当前字典项的键值、状态和说明信息。",
    submitLabel: "保存变更",
  },
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
  const header = SHEET_HEADER_MAP[mode]

  const parentLabel = useMemo(() => {
    if (!parent) {
      return "根目录"
    }

    return getDictDisplayName(parent)
  }, [parent])
  const { form } = useDictMutateForm({ mode, dict, parent, onSubmit })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              <DictMutateFormFields form={form} parentLabel={parentLabel} />
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end">
            <DictMutateSheetFooter
              isBusy={isPending || form.state.isSubmitting}
              submitLabel={header.submitLabel}
              onCancel={() => onOpenChange(false)}
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
