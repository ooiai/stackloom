"use client"

import { useMemo } from "react"
import { useForm } from "@tanstack/react-form"

import { Textarea } from "@/components/reui/textarea"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LabelField } from "@/components/topui/label-field"
import { LabelTooltip } from "@/components/topui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  dictFormSchema,
  getDefaultDictFormValues,
  getDictDisplayName,
} from "@/lib/dicts"
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
  const defaultValues = useMemo(
    () => getDefaultDictFormValues(dict, parent),
    [dict, parent]
  )

  const parentLabel = useMemo(() => {
    if (!parent) {
      return "根目录"
    }

    return getDictDisplayName(parent)
  }, [parent])

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: dictFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
            {header.title}
          </SheetTitle>
          <SheetDescription className="max-w-2xl text-sm leading-6 text-muted-foreground/80">
            {header.description}
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <FieldGroup>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">
                  基础信息
                </h3>
                <p className="text-[13px] leading-5 text-muted-foreground">
                  定义字典项的展示名称、键值和归属类型
                </p>
              </div>

              <div className="grid gap-x-4 gap-y-5 md:grid-cols-1">
                <Field>
                  <FieldLabel>
                    <LabelTooltip
                      label="所属节点"
                      content="当前编辑不会变更父子层级关系。"
                    />
                  </FieldLabel>
                  <FieldContent>
                    <Input value={parentLabel} disabled />
                  </FieldContent>
                </Field>

                <form.Field name="dict_type">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="字典类型"
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          placeholder="例如：gender"
                          aria-invalid={isInvalid}
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>

                <form.Field name="label">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="显示名称"
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          placeholder="例如：男"
                          aria-invalid={isInvalid}
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>

                <form.Field name="dict_key">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="字典键"
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          placeholder="例如：male"
                          aria-invalid={isInvalid}
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>

                <form.Field name="dict_value">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="字典值"
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          placeholder="例如：1"
                          aria-invalid={isInvalid}
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>

                <form.Field name="sort">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <LabelField
                        label="排序值"
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null
                        }
                        tooltip={{ content: "数值越小，列表中越靠前" }}
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min={0}
                          max={9999}
                          value={String(field.state.value)}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(
                              Number(event.target.value || "0")
                            )
                          }
                          aria-invalid={isInvalid}
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>
              </div>
            </FieldGroup>

            <FieldGroup>
              <form.Field name="description">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <LabelField
                      label="说明"
                      htmlFor={field.name}
                      invalid={isInvalid}
                      error={
                        isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null
                      }
                    >
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        rows={3}
                        placeholder="记录字典项的适用范围、业务含义或注意事项。"
                        aria-invalid={isInvalid}
                      />
                    </LabelField>
                  )
                }}
              </form.Field>

              <form.Field name="ext">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <LabelField
                      label="扩展配置"
                      htmlFor={field.name}
                      invalid={isInvalid}
                      error={
                        isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null
                      }
                      description={
                        <span className="text-[13px] leading-5 text-muted-foreground">
                          使用 JSON 存储额外配置，留空时会自动写入空对象。
                        </span>
                      }
                    >
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        rows={6}
                        placeholder='例如：{"color":"blue"}'
                        aria-invalid={isInvalid}
                      />
                    </LabelField>
                  )
                }}
              </form.Field>
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isPending || form.state.isSubmitting}
            >
              {header.submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
