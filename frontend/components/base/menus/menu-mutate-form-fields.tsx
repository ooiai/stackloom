"use client"

import {
  MenuMutateBasicSection,
  MenuMutateDisplaySection,
  MenuMutateRouteSection,
} from "@/components/base/menus/menu-mutate-sheet-sections"
import { LabelField } from "@/components/topui/label-field"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/reui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import {
  getMenuTypeOptions,
} from "@/components/base/menus/helpers"
import type { MenuMutateFormApi } from "@/components/base/menus/hooks/use-menu-mutate-form"
import { useI18n } from "@/providers/i18n-provider"

export function MenuMutateFormFields({
  form,
  parentLabel,
}: {
  form: MenuMutateFormApi
  parentLabel: string
}) {
  const { t } = useI18n()
  const typeOptions = getMenuTypeOptions(t)

  return (
    <>
      <MenuMutateBasicSection>
        <Field className="sm:col-span-2">
          <FieldLabel>{t("menus.form.parent.label")}</FieldLabel>
          <FieldContent>
            <Input value={parentLabel} disabled />
          </FieldContent>
        </Field>

        <form.Field name="code">
          {(field) => (
            <LabelField
              label={t("menus.form.code.label")}
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
                placeholder={t("menus.form.code.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="name">
          {(field) => (
            <LabelField
              label={t("menus.form.name.label")}
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
                placeholder={t("menus.form.name.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="menu_type">
          {(field) => (
            <Field>
              <FieldLabel>{t("menus.form.type.label")}</FieldLabel>
              <FieldContent>
                <Select
                  value={String(field.state.value)}
                  onValueChange={(value) =>
                    field.handleChange(Number(value) as 1 | 2 | 3)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </MenuMutateBasicSection>

      <MenuMutateRouteSection>
        <form.Field name="path">
          {(field) => (
            <LabelField label={t("menus.form.path.label")} htmlFor={field.name}>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("menus.form.path.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="component">
          {(field) => (
            <LabelField
              label={t("menus.form.component.label")}
              htmlFor={field.name}
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("menus.form.component.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="redirect">
          {(field) => (
            <LabelField
              label={t("menus.form.redirect.label")}
              htmlFor={field.name}
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("menus.form.redirect.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="icon">
          {(field) => (
            <LabelField label={t("menus.form.icon.label")} htmlFor={field.name}>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("menus.form.icon.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>
      </MenuMutateRouteSection>

      <MenuMutateDisplaySection>
        <form.Field name="sort">
          {(field) => (
            <LabelField label={t("menus.form.sort.label")} htmlFor={field.name}>
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
              <FieldLabel>{t("menus.form.status.label")}</FieldLabel>
              <FieldContent>
                <Select
                  value={String(field.state.value)}
                  onValueChange={(value) =>
                    field.handleChange(Number(value) as 0 | 1)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      {t("menus.status.active.label")}
                    </SelectItem>
                    <SelectItem value="0">
                      {t("menus.status.disabled.label")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="visible">
          {(field) => (
            <Field orientation="horizontal">
              <Checkbox
                checked={field.state.value}
                onCheckedChange={(checked) =>
                  field.handleChange(Boolean(checked))
                }
              />
              <FieldContent>
                <FieldLabel>{t("menus.form.visible.label")}</FieldLabel>
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="keep_alive">
          {(field) => (
            <Field orientation="horizontal">
              <Checkbox
                checked={field.state.value}
                onCheckedChange={(checked) =>
                  field.handleChange(Boolean(checked))
                }
              />
              <FieldContent>
                <FieldLabel>{t("menus.form.keepAlive.label")}</FieldLabel>
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </MenuMutateDisplaySection>
    </>
  )
}
