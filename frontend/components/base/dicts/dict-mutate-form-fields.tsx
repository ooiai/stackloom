"use client"

import {
  DictMutateBasicSection,
  DictMutateSupplementSection,
} from "@/components/base/dicts/dict-mutate-sheet-sections"
import { Textarea } from "@/components/reui/textarea"
import { LabelField } from "@/components/topui/label-field"
import { LabelTooltip } from "@/components/topui/tooltip"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { DictMutateFormApi } from "@/components/base/dicts/hooks/use-dict-mutate-form"

interface DictMutateFormFieldsProps {
  form: DictMutateFormApi
  parentLabel: string
}

export function DictMutateFormFields({
  form,
  parentLabel,
}: DictMutateFormFieldsProps) {
  return (
    <>
      <DictMutateBasicSection>
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
                  onChange={(event) => field.handleChange(event.target.value)}
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
                  onChange={(event) => field.handleChange(event.target.value)}
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
                  onChange={(event) => field.handleChange(event.target.value)}
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
                  onChange={(event) => field.handleChange(event.target.value)}
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
                    field.handleChange(Number(event.target.value || "0"))
                  }
                  aria-invalid={isInvalid}
                />
              </LabelField>
            )
          }}
        </form.Field>
      </DictMutateBasicSection>

      <DictMutateSupplementSection>
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
                  onChange={(event) => field.handleChange(event.target.value)}
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
                  onChange={(event) => field.handleChange(event.target.value)}
                  rows={6}
                  placeholder='例如：{"color":"blue"}'
                  aria-invalid={isInvalid}
                />
              </LabelField>
            )
          }}
        </form.Field>
      </DictMutateSupplementSection>
    </>
  )
}
