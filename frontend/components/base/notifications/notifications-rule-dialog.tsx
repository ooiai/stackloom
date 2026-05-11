"use client"

import { useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/providers/i18n-provider"
import type { NotificationRuleData } from "@/types/base.types"

import {
  type NotificationRuleFormValues,
  type NotificationTemplateOption,
  type NotificationUserOption,
  RULE_RECIPIENT_SELECTOR_OPTIONS,
  createNotificationRuleSchema,
  createRuleFormValues,
  formatRecipientSelectorLabel,
  getFormErrors,
} from "./helpers"

interface NotificationsRuleDialogProps {
  open: boolean
  mode: "create" | "update"
  item: NotificationRuleData | null
  userOptions: NotificationUserOption[]
  templateOptions: NotificationTemplateOption[]
  isBusy: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: NotificationRuleFormValues) => Promise<unknown>
}

export function NotificationsRuleDialog({
  open,
  mode,
  item,
  userOptions,
  templateOptions,
  isBusy,
  onOpenChange,
  onSubmit,
}: NotificationsRuleDialogProps) {
  const { t } = useI18n()
  const [values, setValues] = useState<NotificationRuleFormValues>(
    createRuleFormValues(item)
  )
  const [errors, setErrors] = useState<
    Partial<Record<keyof NotificationRuleFormValues, string>>
  >({})
  const schema = useMemo(() => createNotificationRuleSchema(t), [t])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isBusy) {
      return
    }

    if (nextOpen) {
      setValues(createRuleFormValues(item))
      setErrors({})
    }

    onOpenChange(nextOpen)
  }

  const toggleUser = (id: string) => {
    setValues((current) => {
      const exists = current.recipient_user_ids.includes(id)
      return {
        ...current,
        recipient_user_ids: exists
          ? current.recipient_user_ids.filter((item) => item !== id)
          : [...current.recipient_user_ids, id],
      }
    })
    setErrors((current) => ({ ...current, recipient_user_ids: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setErrors(getFormErrors(parsed.error))
      return
    }

    setErrors({})
    await onSubmit(values)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/70 bg-background p-5 shadow-2xl outline-none">
          <div className="mb-4 space-y-1">
            <DialogPrimitive.Title className="text-base font-semibold">
              {mode === "create"
                ? t("notifications.dialogs.ruleCreate.title")
                : t("notifications.dialogs.ruleUpdate.title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {t("notifications.dialogs.rule.description")}
            </DialogPrimitive.Description>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="notification-rule-name">
                {t("notifications.form.name")}
              </FieldLabel>
              <Input
                id="notification-rule-name"
                disabled={isBusy}
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({ ...current, name: event.target.value }))
                }
                placeholder={t("notifications.placeholders.name")}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={!!errors.event_code}>
                <FieldLabel htmlFor="notification-rule-event-code">
                  {t("notifications.form.eventCode")}
                </FieldLabel>
                <Input
                  id="notification-rule-event-code"
                  disabled={isBusy}
                  value={values.event_code}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      event_code: event.target.value,
                    }))
                  }
                  placeholder={t("notifications.placeholders.eventCode")}
                />
                {errors.event_code ? (
                  <FieldError>{errors.event_code}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={!!errors.template_id}>
                <FieldLabel htmlFor="notification-rule-template">
                  {t("notifications.form.template")}
                </FieldLabel>
                <select
                  id="notification-rule-template"
                  disabled={isBusy}
                  value={values.template_id}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      template_id: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t("notifications.placeholders.template")}</option>
                  {templateOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.template_id ? (
                  <FieldError>{errors.template_id}</FieldError>
                ) : null}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="notification-rule-selector">
                {t("notifications.form.recipientSelector")}
              </FieldLabel>
              <select
                id="notification-rule-selector"
                disabled={isBusy}
                value={values.recipient_selector_type}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    recipient_selector_type:
                      event.target.value as NotificationRuleFormValues["recipient_selector_type"],
                    recipient_user_ids:
                      event.target.value === "explicit_users"
                        ? current.recipient_user_ids
                        : [],
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {RULE_RECIPIENT_SELECTOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {formatRecipientSelectorLabel(t, option.value)}
                  </option>
                ))}
              </select>
            </Field>

            {values.recipient_selector_type === "explicit_users" ? (
              <Field data-invalid={!!errors.recipient_user_ids}>
                <FieldLabel>{t("notifications.form.recipientUsers")}</FieldLabel>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border/70 p-3">
                  {userOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={values.recipient_user_ids.includes(option.id)}
                        onChange={() => toggleUser(option.id)}
                        disabled={isBusy}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.recipient_user_ids ? (
                  <FieldError>{errors.recipient_user_ids}</FieldError>
                ) : null}
              </Field>
            ) : null}

            <Field orientation="horizontal">
              <FieldLabel htmlFor="notification-rule-enabled">
                {t("notifications.form.enabled")}
              </FieldLabel>
              <Switch
                id="notification-rule-enabled"
                checked={values.enabled}
                onCheckedChange={(checked) =>
                  setValues((current) => ({ ...current, enabled: checked }))
                }
                disabled={isBusy}
              />
            </Field>

            <div className="flex items-center justify-end gap-2">
              <DialogPrimitive.Close render={<Button variant="outline" type="button" />}>
                {t("common.actions.cancel", undefined, "取消")}
              </DialogPrimitive.Close>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? <Spinner className="size-4" /> : null}
                {mode === "create"
                  ? t("notifications.actions.createRule")
                  : t("notifications.actions.saveRule")}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
