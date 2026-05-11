"use client"

import { useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useI18n } from "@/providers/i18n-provider"

import {
  type NotificationSendFormValues,
  type NotificationUserOption,
  DEFAULT_SEND_FORM_VALUES,
  RECIPIENT_SELECTOR_OPTIONS,
  createNotificationSendSchema,
  formatRecipientSelectorLabel,
  getFormErrors,
} from "./helpers"

interface NotificationsSendDialogProps {
  open: boolean
  userOptions: NotificationUserOption[]
  isBusy: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: NotificationSendFormValues) => Promise<unknown>
}

export function NotificationsSendDialog({
  open,
  userOptions,
  isBusy,
  onOpenChange,
  onSubmit,
}: NotificationsSendDialogProps) {
  const { t } = useI18n()
  const [values, setValues] = useState<NotificationSendFormValues>(
    DEFAULT_SEND_FORM_VALUES
  )
  const [errors, setErrors] = useState<
    Partial<Record<keyof NotificationSendFormValues, string>>
  >({})
  const schema = useMemo(() => createNotificationSendSchema(t), [t])

  const resetForm = () => {
    setValues(DEFAULT_SEND_FORM_VALUES)
    setErrors({})
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isBusy) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
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
              {t("notifications.dialogs.send.title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {t("notifications.dialogs.send.description")}
            </DialogPrimitive.Description>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="notification-send-title">
                {t("notifications.form.title")}
              </FieldLabel>
              <Input
                id="notification-send-title"
                disabled={isBusy}
                value={values.title}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder={t("notifications.placeholders.title")}
              />
              {errors.title ? <FieldError>{errors.title}</FieldError> : null}
            </Field>

            <Field data-invalid={!!errors.body}>
              <FieldLabel htmlFor="notification-send-body">
                {t("notifications.form.body")}
              </FieldLabel>
              <textarea
                id="notification-send-body"
                disabled={isBusy}
                value={values.body}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    body: event.target.value,
                  }))
                }
                placeholder={t("notifications.placeholders.body")}
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.body ? <FieldError>{errors.body}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="notification-send-action-url">
                {t("notifications.form.actionUrl")}
              </FieldLabel>
              <Input
                id="notification-send-action-url"
                disabled={isBusy}
                value={values.action_url}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    action_url: event.target.value,
                  }))
                }
                placeholder={t("notifications.placeholders.actionUrl")}
              />
            </Field>

            <Field data-invalid={!!errors.recipient_selector_type}>
              <FieldLabel htmlFor="notification-send-selector">
                {t("notifications.form.recipientSelector")}
              </FieldLabel>
              <select
                id="notification-send-selector"
                disabled={isBusy}
                value={values.recipient_selector_type}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    recipient_selector_type:
                      event.target
                        .value as NotificationSendFormValues["recipient_selector_type"],
                    recipient_user_ids:
                      event.target.value === "explicit_users"
                        ? current.recipient_user_ids
                        : [],
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {RECIPIENT_SELECTOR_OPTIONS.map((option) => (
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

            <div className="flex items-center justify-end gap-2">
              <DialogPrimitive.Close render={<Button variant="outline" type="button" />}>
                {t("common.actions.cancel", undefined, "取消")}
              </DialogPrimitive.Close>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? <Spinner className="size-4" /> : null}
                {t("notifications.actions.send")}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
