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
import { useI18n } from "@/providers/i18n-provider"

interface DictMutateFormFieldsProps {
  form: DictMutateFormApi
  mode: "create" | "update"
  hasParent: boolean
  parentLabel: string
}

export function DictMutateFormFields({
  form,
  mode,
  hasParent,
  parentLabel,
}: DictMutateFormFieldsProps) {
  const { t } = useI18n()
  const isDictTypeLocked = mode === "update" || hasParent

  return (
    <>
      <DictMutateBasicSection>
        <Field>
          <FieldLabel>
            <LabelTooltip
              label={t("dicts.form.parent.label")}
              content={t("dicts.form.parent.description")}
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
                label={t("dicts.form.type.label")}
                htmlFor={field.name}
                invalid={isInvalid}
                description={
                  isDictTypeLocked ? (
                    <span className="text-[13px] leading-5 text-muted-foreground">
                      {mode === "update"
                        ? t("dicts.form.type.lockedOnEdit")
                        : t("dicts.form.type.lockedOnChild")}
                    </span>
                  ) : null
                }
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
                  placeholder={t("dicts.form.type.placeholder")}
                  aria-invalid={isInvalid}
                  disabled={isDictTypeLocked}
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
                label={t("dicts.form.label.label")}
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
                  placeholder={t("dicts.form.label.placeholder")}
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
                label={t("dicts.form.key.label")}
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
                  placeholder={t("dicts.form.key.placeholder")}
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
                label={t("dicts.form.value.label")}
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
                  placeholder={t("dicts.form.value.placeholder")}
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
                label={t("dicts.form.sort.label")}
                htmlFor={field.name}
                invalid={isInvalid}
                error={
                  isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null
                }
                tooltip={{ content: t("dicts.form.sort.tooltip") }}
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
                label={t("dicts.form.description.label")}
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
                  placeholder={t("dicts.form.description.placeholder")}
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
                label={t("dicts.form.ext.label")}
                htmlFor={field.name}
                invalid={isInvalid}
                error={
                  isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null
                }
                description={
                  <span className="text-[13px] leading-5 text-muted-foreground">
                    {t("dicts.form.ext.description")}
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
                  placeholder={t("dicts.form.ext.placeholder")}
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
