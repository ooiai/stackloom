"use client"

import {
  TenantMutateBasicSection,
  TenantMutateSupplementSection,
} from "@/components/base/tenants/tenant-mutate-sheet-sections"
import { Textarea } from "@/components/reui/textarea"
import { generateTenantCode } from "@/lib/generateCode"
import { LabelField } from "@/components/topui/label-field"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import type { TenantMutateFormApi } from "@/components/base/tenants/hooks/use-tenant-mutate-form"
import { useI18n } from "@/providers/i18n-provider"

export function TenantMutateFormFields({
  form,
  parentLabel,
}: {
  form: TenantMutateFormApi
  parentLabel: string
}) {
  const { t } = useI18n()
  const tenantStatusLabelMap: Record<0 | 1 | 2, string> = {
    0: t("tenants.status.disabled.label"),
    1: t("tenants.status.active.label"),
    2: t("tenants.status.expired.label"),
  }

  return (
    <>
      <TenantMutateBasicSection>
        <Field className="sm:col-span-2">
          <FieldLabel>{t("tenants.form.parent.label")}</FieldLabel>
          <FieldContent>
            <Input value={parentLabel} disabled />
          </FieldContent>
        </Field>

        <form.Field name="name">
          {(field) => (
            <LabelField
              label={t("tenants.form.name.label")}
              htmlFor={field.name}
              error={
                field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null
              }
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  const value = event.target.value
                  field.handleChange(value)
                  form.setFieldValue("slug", generateTenantCode(value))
                }}
                placeholder={t("tenants.form.name.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="slug">
          {(field) => (
            <LabelField
              label={t("tenants.form.slug.label")}
              htmlFor={field.name}
              error={
                field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null
              }
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("tenants.form.slug.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <Field>
              <FieldLabel>{t("tenants.form.status.label")}</FieldLabel>
              <FieldContent>
                <Select
                  value={String(field.state.value)}
                  onValueChange={(value) =>
                    field.handleChange(Number(value) as 0 | 1 | 2)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {tenantStatusLabelMap[field.state.value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      {t("tenants.status.active.label")}
                    </SelectItem>
                    <SelectItem value="0">
                      {t("tenants.status.disabled.label")}
                    </SelectItem>
                    <SelectItem value="2">
                      {t("tenants.status.expired.label")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </TenantMutateBasicSection>

      <TenantMutateSupplementSection>
        <form.Field name="description">
          {(field) => (
            <LabelField
              label={t("tenants.form.description.label")}
              htmlFor={field.name}
              className="sm:col-span-2"
            >
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={3}
                placeholder={t("tenants.form.description.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="plan_code">
          {(field) => (
            <LabelField
              label={t("tenants.form.plan_code.label")}
              htmlFor={field.name}
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("tenants.form.plan_code.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="owner_user_id">
          {(field) => (
            <LabelField
              label={t("tenants.form.owner_user_id.label")}
              htmlFor={field.name}
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("tenants.form.owner_user_id.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="expired_at">
          {(field) => (
            <LabelField
              label={t("tenants.form.expired_at.label")}
              htmlFor={field.name}
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("tenants.form.expired_at.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>
      </TenantMutateSupplementSection>
    </>
  )
}
