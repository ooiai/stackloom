"use client"

import { useState } from "react"
import { enUS, zhCN } from "react-day-picker/locale"

import {
  TenantMutateBasicSection,
  TenantMutateSupplementSection,
} from "@/components/base/tenants/tenant-mutate-sheet-sections"
import { Textarea } from "@/components/reui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/reui/popover"
import { generateTenantCode } from "@/lib/generateCode"
import { LabelField } from "@/components/topui/label-field"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
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
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import { CalendarIcon, XIcon } from "lucide-react"

const calendarLocales = {
  "en-US": enUS,
  "zh-CN": zhCN,
} as const

function getDateInputValue(value: string) {
  if (!value) {
    return ""
  }

  const matched = value.match(/\d{4}-\d{2}-\d{2}/)

  return matched?.[0] ?? value
}

function parseDateValue(value: string) {
  const dateValue = getDateInputValue(value)

  if (!dateValue) {
    return undefined
  }

  const [year, month, day] = dateValue.split("-").map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined
  }

  return date
}

function formatDateValue(date: Date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function TenantExpiredAtDatePicker({
  id,
  value,
  placeholder,
  clearLabel,
  locale,
  onBlur,
  onChange,
}: {
  id: string
  value: string
  placeholder: string
  clearLabel: string
  locale: AppLocale
  onBlur: () => void
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDateValue(value)
  const displayValue = selectedDate ? formatDateValue(selectedDate) : ""

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className={cn(
                "h-8 w-full justify-start text-left font-normal",
                !displayValue && "text-muted-foreground"
              )}
              onBlur={() => onBlur()}
            />
          }
        >
          <CalendarIcon />
          <span className="truncate">{displayValue || placeholder}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            locale={calendarLocales[locale]}
            onSelect={(date) => {
              onChange(date ? formatDateValue(date) : "")
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>

      {displayValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={clearLabel}
          onClick={() => {
            onChange("")
            onBlur()
          }}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  )
}

export function TenantMutateFormFields({
  form,
  parentLabel,
}: {
  form: TenantMutateFormApi
  parentLabel: string
}) {
  const { locale, t } = useI18n()
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
              <TenantExpiredAtDatePicker
                id={field.name}
                value={field.state.value}
                placeholder={t("tenants.form.expired_at.placeholder")}
                clearLabel={t("common.actions.clear")}
                locale={locale}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            </LabelField>
          )}
        </form.Field>
      </TenantMutateSupplementSection>
    </>
  )
}
