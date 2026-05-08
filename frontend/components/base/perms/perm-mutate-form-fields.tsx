"use client"

import {
  PermMutateBasicSection,
  PermMutateDisplaySection,
  PermMutateRouteSection,
} from "@/components/base/perms/perm-mutate-sheet-sections"
import type { PermMutateFormApi } from "@/components/base/perms/hooks/use-perm-mutate-form"
import {
  PERM_HTTP_METHOD_OPTIONS,
} from "@/components/base/perms/helpers"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import type { PermHttpMethod } from "@/types/base.types"
import { Textarea } from "@/components/reui/textarea"
import { LabelField } from "@/components/topui/label-field"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/providers/i18n-provider"

export function PermMutateFormFields({
  form,
  parentLabel,
}: {
  form: PermMutateFormApi
  parentLabel: string
}) {
  const { t } = useI18n()
  const methodLabelMap: Record<PermHttpMethod | "", string> = {
    "": t("perms.form.method.none"),
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DELETE",
    HEAD: "HEAD",
    OPTIONS: "OPTIONS",
  }
  const statusLabelMap: Record<0 | 1, string> = {
    0: t("perms.status.disabled.label"),
    1: t("perms.status.active.label"),
  }

  return (
    <>
      <PermMutateBasicSection>
        <Field className="sm:col-span-2">
          <FieldLabel>{t("perms.form.parent.label")}</FieldLabel>
          <FieldContent>
            <Input value={parentLabel} disabled />
          </FieldContent>
        </Field>

        <form.Field name="name">
          {(field) => (
            <LabelField
              label={t("perms.form.name.label")}
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
                placeholder={t("perms.form.name.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="code">
          {(field) => (
            <LabelField
              label={t("perms.form.code.label")}
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
                placeholder={t("perms.form.code.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>
      </PermMutateBasicSection>

      <PermMutateRouteSection>
        <form.Field name="resource">
          {(field) => (
            <LabelField
              label={t("perms.form.resource.label")}
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
                placeholder={t("perms.form.resource.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="action">
          {(field) => (
            <LabelField
              label={t("perms.form.action.label")}
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
                placeholder={t("perms.form.action.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="method">
          {(field) => (
            <Field>
              <FieldLabel>{t("perms.form.method.label")}</FieldLabel>
              <FieldContent>
                <Select
                  value={field.state.value || "__none__"}
                  onValueChange={(value) =>
                    field.handleChange(
                      value === "__none__" ? "" : (value as PermHttpMethod)
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {methodLabelMap[field.state.value || ""]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {t("perms.form.method.none")}
                    </SelectItem>
                    {PERM_HTTP_METHOD_OPTIONS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <LabelField
              label={t("perms.form.description.label")}
              htmlFor={field.name}
              error={
                field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null
              }
            >
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={4}
                placeholder={t("perms.form.description.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>
      </PermMutateRouteSection>

      <PermMutateDisplaySection>
        <form.Field name="sort">
          {(field) => (
            <LabelField label={t("perms.form.sort.label")} htmlFor={field.name}>
              <Input
                id={field.name}
                type="number"
                min={0}
                max={9999}
                value={String(field.state.value)}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(Number(event.target.value || "0"))
                }
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <Field>
              <FieldLabel>{t("perms.form.status.label")}</FieldLabel>
              <FieldContent>
                <Select
                  value={String(field.state.value)}
                  onValueChange={(value) =>
                    field.handleChange(Number(value) as 0 | 1)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {statusLabelMap[field.state.value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      {t("perms.status.active.label")}
                    </SelectItem>
                    <SelectItem value="0">
                      {t("perms.status.disabled.label")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </PermMutateDisplaySection>
    </>
  )
}
