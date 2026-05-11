"use client"

import { useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/providers/i18n-provider"
import type { NotificationTemplateData } from "@/types/base.types"

import {
  NOTIFICATION_TEMPLATE_LOCALES,
  type NotificationTemplateFormValues,
  createNotificationTemplateSchema,
  createTemplateFormValues,
  formatNotificationLocaleLabel,
  getFormErrors,
} from "./helpers"

interface NotificationsTemplateDialogProps {
  open: boolean
  mode: "create" | "update"
  item: NotificationTemplateData | null
  isBusy: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: NotificationTemplateFormValues) => Promise<unknown>
}

export function NotificationsTemplateDialog({
  open,
  mode,
  item,
  isBusy,
  onOpenChange,
  onSubmit,
}: NotificationsTemplateDialogProps) {
  const { t } = useI18n()
  const templateExamples = {
    memberUsernameExample: "{{member.username}}",
    tenantNameExample: "{{tenant.name}}",
  }
  const [values, setValues] = useState<NotificationTemplateFormValues>(
    createTemplateFormValues(item)
  )
  const [errors, setErrors] = useState<
    Partial<Record<keyof NotificationTemplateFormValues, string>>
  >({})
  const schema = useMemo(() => createNotificationTemplateSchema(t), [t])
  const selectedLocaleLabel = formatNotificationLocaleLabel(t, values.locale)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isBusy) {
      return
    }

    if (nextOpen) {
      setValues(createTemplateFormValues(item))
      setErrors({})
    }

    onOpenChange(nextOpen)
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
                ? t("notifications.dialogs.templateCreate.title")
                : t("notifications.dialogs.templateUpdate.title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {t("notifications.dialogs.template.description", templateExamples)}
            </DialogPrimitive.Description>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="notification-template-code">
                  {t("notifications.form.code")}
                </FieldLabel>
                <Input
                  id="notification-template-code"
                  disabled={isBusy}
                  value={values.code}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                  placeholder={t("notifications.placeholders.code")}
                />
                {errors.code ? <FieldError>{errors.code}</FieldError> : null}
              </Field>

              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="notification-template-name">
                  {t("notifications.form.name")}
                </FieldLabel>
                <Input
                  id="notification-template-name"
                  disabled={isBusy}
                  value={values.name}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder={t("notifications.placeholders.name")}
                />
                {errors.name ? <FieldError>{errors.name}</FieldError> : null}
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="notification-template-event-code">
                  {t("notifications.form.eventCode")}
                </FieldLabel>
                <Input
                  id="notification-template-event-code"
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
              </Field>

              <Field>
                <FieldLabel htmlFor="notification-template-locale">
                  {t("notifications.form.locale")}
                </FieldLabel>
                <Select
                  value={values.locale}
                  onValueChange={(value) =>
                    value
                      ? setValues((current) => ({
                          ...current,
                          locale: value,
                        }))
                      : undefined
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    id="notification-template-locale"
                    disabled={isBusy}
                  >
                    <SelectValue>{selectedLocaleLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TEMPLATE_LOCALES.map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {formatNotificationLocaleLabel(t, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field data-invalid={!!errors.title_template}>
              <FieldLabel htmlFor="notification-template-title-template">
                {t("notifications.form.titleTemplate")}
              </FieldLabel>
              <Input
                id="notification-template-title-template"
                disabled={isBusy}
                value={values.title_template}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    title_template: event.target.value,
                  }))
                }
                placeholder={t(
                  "notifications.placeholders.titleTemplate",
                  templateExamples
                )}
              />
              {errors.title_template ? (
                <FieldError>{errors.title_template}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={!!errors.body_template}>
              <FieldLabel htmlFor="notification-template-body-template">
                {t("notifications.form.bodyTemplate")}
              </FieldLabel>
              <textarea
                id="notification-template-body-template"
                disabled={isBusy}
                value={values.body_template}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    body_template: event.target.value,
                  }))
                }
                placeholder={t(
                  "notifications.placeholders.bodyTemplate",
                  templateExamples
                )}
                className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.body_template ? (
                <FieldError>{errors.body_template}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="notification-template-action-url-template">
                {t("notifications.form.actionUrlTemplate")}
              </FieldLabel>
              <Input
                id="notification-template-action-url-template"
                disabled={isBusy}
                value={values.action_url_template}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    action_url_template: event.target.value,
                  }))
                }
                placeholder={t("notifications.placeholders.actionUrlTemplate")}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="notification-template-status">
                {t("notifications.form.enabled")}
              </FieldLabel>
              <Switch
                id="notification-template-status"
                checked={values.status === 1}
                onCheckedChange={(checked) =>
                  setValues((current) => ({
                    ...current,
                    status: checked ? 1 : 0,
                  }))
                }
                disabled={isBusy}
              />
            </Field>

            <div className="flex items-center justify-end gap-2">
              <DialogPrimitive.Close
                render={<Button variant="outline" type="button" />}
              >
                {t("common.actions.cancel")}
              </DialogPrimitive.Close>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? <Spinner className="size-4" /> : null}
                {mode === "create"
                  ? t("notifications.actions.createTemplate")
                  : t("notifications.actions.saveTemplate")}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
