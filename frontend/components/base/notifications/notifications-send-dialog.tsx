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
import { useI18n } from "@/providers/i18n-provider"

import {
  type NotificationSendFormValues,
  type NotificationTemplateOption,
  type NotificationUserOption,
  DEFAULT_SEND_FORM_VALUES,
  RECIPIENT_SELECTOR_OPTIONS,
  applyTemplateToSendForm,
  createNotificationSendSchema,
  formatRecipientSelectorLabel,
  getFormErrors,
} from "./helpers"
import { NotificationsUserPicker } from "./notifications-user-picker"

interface NotificationsSendDialogProps {
  open: boolean
  userOptions: NotificationUserOption[]
  templateOptions: NotificationTemplateOption[]
  isBusy: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: NotificationSendFormValues) => Promise<unknown>
}

export function NotificationsSendDialog({
  open,
  userOptions,
  templateOptions,
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
  const selectedTemplateLabel =
    templateOptions.find((option) => option.id === values.template_id)?.label ??
    undefined
  const selectedRecipientSelectorLabel = formatRecipientSelectorLabel(
    t,
    values.recipient_selector_type
  )

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
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/70 bg-background p-5 shadow-2xl outline-none">
          <div className="mb-4 space-y-1">
            <DialogPrimitive.Title className="text-base font-semibold">
              {t("notifications.dialogs.send.title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {t("notifications.dialogs.send.description")}
            </DialogPrimitive.Description>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="space-y-4 rounded-xl border border-border/70 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t("notifications.sections.content")}
                </p>

                <Field>
                  <FieldLabel htmlFor="notification-send-template">
                    {t("notifications.form.template")}
                  </FieldLabel>
                  <Select
                    value={values.template_id || "manual"}
                    onValueChange={(value) => {
                      if (!value || value === "manual") {
                        setValues((current) => ({
                          ...current,
                          template_id: "",
                        }))
                        return
                      }
                      setValues((current) =>
                        applyTemplateToSendForm(
                          current,
                          templateOptions.find((option) => option.id === value)
                        )
                      )
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      id="notification-send-template"
                      disabled={isBusy}
                    >
                      <SelectValue placeholder={t("notifications.placeholders.template")}>
                        {values.template_id
                          ? selectedTemplateLabel
                          : t("notifications.templateSelection.manual")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">
                        {t("notifications.templateSelection.manual")}
                      </SelectItem>
                      {templateOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

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
              </div>

              <div className="space-y-4 rounded-xl border border-border/70 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t("notifications.sections.recipients")}
                </p>

                <Field data-invalid={!!errors.recipient_selector_type}>
                  <FieldLabel htmlFor="notification-send-selector">
                    {t("notifications.form.recipientSelector")}
                  </FieldLabel>
                  <Select
                    value={values.recipient_selector_type}
                    onValueChange={(value) =>
                      value
                        ? setValues((current) => ({
                            ...current,
                            recipient_selector_type:
                              value as NotificationSendFormValues["recipient_selector_type"],
                            recipient_user_ids:
                              value === "explicit_users"
                                ? current.recipient_user_ids
                                : [],
                          }))
                        : undefined
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      id="notification-send-selector"
                      disabled={isBusy}
                    >
                      <SelectValue>{selectedRecipientSelectorLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {RECIPIENT_SELECTOR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {formatRecipientSelectorLabel(t, option.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {values.recipient_selector_type === "explicit_users" ? (
                  <NotificationsUserPicker
                    users={userOptions}
                    selectedIds={values.recipient_user_ids}
                    onToggle={(id) =>
                      setValues((current) => {
                        const exists = current.recipient_user_ids.includes(id)
                        return {
                          ...current,
                          recipient_user_ids: exists
                            ? current.recipient_user_ids.filter(
                                (item) => item !== id
                              )
                            : [...current.recipient_user_ids, id],
                        }
                      })
                    }
                    disabled={isBusy}
                    error={errors.recipient_user_ids}
                  />
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <DialogPrimitive.Close render={<Button variant="outline" type="button" />}>
                {t("common.actions.cancel")}
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
