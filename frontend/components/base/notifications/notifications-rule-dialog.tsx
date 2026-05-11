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
import type { NotificationRuleData } from "@/types/base.types"

import {
  type NotificationRuleFormValues,
  type NotificationTemplateOption,
  type NotificationUserOption,
  RULE_SCHEDULE_KIND_OPTIONS,
  RULE_TRIGGER_MODE_OPTIONS,
  RULE_WEEKDAY_OPTIONS,
  createNotificationRuleSchema,
  createRuleFormValues,
  formatRecipientSelectorLabel,
  formatRuleTriggerModeLabel,
  formatWeekdayLabel,
  getFormErrors,
  getRuleRecipientSelectorOptions,
} from "./helpers"
import { NotificationsUserPicker } from "./notifications-user-picker"

interface NotificationsRuleDialogProps {
  open: boolean
  mode: "create" | "update"
  item: NotificationRuleData | null
  userOptions: NotificationUserOption[]
  templateOptions: NotificationTemplateOption[]
  isBusy: boolean
  onOpenChange: (open: boolean) => void
  onOpenCreateTemplate: () => void
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
  onOpenCreateTemplate,
  onSubmit,
}: NotificationsRuleDialogProps) {
  const { t } = useI18n()
  const hasTemplateOptions = templateOptions.length > 0
  const [values, setValues] = useState<NotificationRuleFormValues>(
    createRuleFormValues(item)
  )
  const [errors, setErrors] = useState<
    Partial<Record<keyof NotificationRuleFormValues, string>>
  >({})
  const schema = useMemo(() => createNotificationRuleSchema(t), [t])
  const selectedTemplateLabel =
    templateOptions.find((option) => option.id === values.template_id)?.label ??
    undefined
  const recipientOptions = getRuleRecipientSelectorOptions(values.trigger_mode)
  const selectedRecipientSelectorLabel = formatRecipientSelectorLabel(
    t,
    values.recipient_selector_type
  )

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

  const toggleWeekday = (weekday: number) => {
    setValues((current) => {
      const exists = current.schedule_weekdays.includes(weekday)
      return {
        ...current,
        schedule_weekdays: exists
          ? current.schedule_weekdays.filter((item) => item !== weekday)
          : [...current.schedule_weekdays, weekday].sort((a, b) => a - b),
      }
    })
    setErrors((current) => ({ ...current, schedule_weekdays: undefined }))
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
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/70 bg-background p-5 shadow-2xl outline-none">
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
            <div className="space-y-4 rounded-xl border border-border/70 p-4">
              <p className="text-sm font-medium text-foreground">
                {t("notifications.sections.basics")}
              </p>

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
                <Field data-invalid={!!errors.trigger_mode}>
                  <FieldLabel htmlFor="notification-rule-trigger-mode">
                    {t("notifications.form.triggerMode")}
                  </FieldLabel>
                  <Select
                    value={values.trigger_mode}
                    onValueChange={(value) =>
                      value
                        ? setValues((current) => ({
                            ...current,
                            trigger_mode:
                              value as NotificationRuleFormValues["trigger_mode"],
                            recipient_selector_type:
                              value === "event" &&
                              current.recipient_selector_type === "actor"
                                ? current.recipient_selector_type
                                : current.recipient_selector_type === "actor"
                                  ? "tenant_admins"
                                  : current.recipient_selector_type,
                          }))
                        : undefined
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      id="notification-rule-trigger-mode"
                      disabled={isBusy}
                    >
                      <SelectValue>
                        {formatRuleTriggerModeLabel(t, values.trigger_mode)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_TRIGGER_MODE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {formatRuleTriggerModeLabel(t, option.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.trigger_mode ? (
                    <FieldError>{errors.trigger_mode}</FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={!!errors.template_id}>
                  <FieldLabel htmlFor="notification-rule-template">
                    {t("notifications.form.template")}
                  </FieldLabel>
                  <Select
                    value={values.template_id}
                    onValueChange={(value) =>
                      setValues((current) => ({
                        ...current,
                        template_id: value ?? "",
                      }))
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      id="notification-rule-template"
                      disabled={isBusy || !hasTemplateOptions}
                      aria-invalid={!!errors.template_id}
                    >
                      <SelectValue placeholder={t("notifications.placeholders.template")}>
                        {selectedTemplateLabel}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {templateOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.template_id ? (
                    <FieldError>{errors.template_id}</FieldError>
                  ) : null}
                  {!hasTemplateOptions ? (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-dashed border-border/70 bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        {t("notifications.dialogs.rule.noTemplates")}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onOpenCreateTemplate}
                      >
                        {t("notifications.actions.newTemplate")}
                      </Button>
                    </div>
                  ) : null}
                </Field>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border/70 p-4">
              <p className="text-sm font-medium text-foreground">
                {t("notifications.sections.trigger")}
              </p>

              <div className="min-h-[12rem] space-y-4">
                {values.trigger_mode === "event" ? (
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
                ) : null}

                {values.trigger_mode === "delay_once" ? (
                  <Field data-invalid={!!errors.delay_seconds}>
                    <FieldLabel htmlFor="notification-rule-delay-seconds">
                      {t("notifications.form.delaySeconds")}
                    </FieldLabel>
                    <Input
                      id="notification-rule-delay-seconds"
                      type="number"
                      min="1"
                      disabled={isBusy}
                      value={values.delay_seconds}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          delay_seconds: event.target.value,
                        }))
                      }
                      placeholder={t("notifications.placeholders.delaySeconds")}
                    />
                    {errors.delay_seconds ? (
                      <FieldError>{errors.delay_seconds}</FieldError>
                    ) : null}
                  </Field>
                ) : null}

                {values.trigger_mode === "fixed_schedule" ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="notification-rule-schedule-kind">
                          {t("notifications.form.scheduleKind")}
                        </FieldLabel>
                        <Select
                          value={values.schedule_kind}
                          onValueChange={(value) =>
                            value
                              ? setValues((current) => ({
                                  ...current,
                                  schedule_kind:
                                    value as NotificationRuleFormValues["schedule_kind"],
                                  schedule_weekdays:
                                    value === "weekly"
                                      ? current.schedule_weekdays
                                      : [],
                                }))
                              : undefined
                          }
                        >
                          <SelectTrigger
                            className="w-full"
                            id="notification-rule-schedule-kind"
                            disabled={isBusy}
                          >
                            <SelectValue>
                              {t(`notifications.scheduleKind.${values.schedule_kind}`)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {RULE_SCHEDULE_KIND_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {t(`notifications.scheduleKind.${option.value}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field data-invalid={!!errors.schedule_time}>
                        <FieldLabel htmlFor="notification-rule-schedule-time">
                          {t("notifications.form.scheduleTime")}
                        </FieldLabel>
                        <Input
                          id="notification-rule-schedule-time"
                          type="time"
                          disabled={isBusy}
                          value={values.schedule_time}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              schedule_time: event.target.value,
                            }))
                          }
                        />
                        {errors.schedule_time ? (
                          <FieldError>{errors.schedule_time}</FieldError>
                        ) : null}
                      </Field>
                    </div>

                    {values.schedule_kind === "weekly" ? (
                      <Field data-invalid={!!errors.schedule_weekdays}>
                        <FieldLabel>{t("notifications.form.scheduleWeekdays")}</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                          {RULE_WEEKDAY_OPTIONS.map((option) => {
                            const active = values.schedule_weekdays.includes(option.value)
                            return (
                              <Button
                                key={option.value}
                                type="button"
                                size="sm"
                                variant={active ? "default" : "outline"}
                                onClick={() => toggleWeekday(option.value)}
                                disabled={isBusy}
                              >
                                {formatWeekdayLabel(t, option.value)}
                              </Button>
                            )
                          })}
                        </div>
                        {errors.schedule_weekdays ? (
                          <FieldError>{errors.schedule_weekdays}</FieldError>
                        ) : null}
                      </Field>
                    ) : null}
                  </div>
                ) : null}

                {values.trigger_mode === "cron_expression" ? (
                  <Field data-invalid={!!errors.cron_expression}>
                    <FieldLabel htmlFor="notification-rule-cron-expression">
                      {t("notifications.form.cronExpression")}
                    </FieldLabel>
                    <Input
                      id="notification-rule-cron-expression"
                      disabled={isBusy}
                      value={values.cron_expression}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          cron_expression: event.target.value,
                        }))
                      }
                      placeholder={t("notifications.placeholders.cronExpression")}
                    />
                    {errors.cron_expression ? (
                      <FieldError>{errors.cron_expression}</FieldError>
                    ) : null}
                  </Field>
                ) : null}
              </div>

              {values.trigger_mode !== "event" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="notification-rule-start-at">
                      {t("notifications.form.startAt")}
                    </FieldLabel>
                    <Input
                      id="notification-rule-start-at"
                      type="datetime-local"
                      disabled={isBusy}
                      value={values.start_at}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          start_at: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field data-invalid={!!errors.end_at}>
                    <FieldLabel htmlFor="notification-rule-end-at">
                      {t("notifications.form.endAt")}
                    </FieldLabel>
                    <Input
                      id="notification-rule-end-at"
                      type="datetime-local"
                      disabled={isBusy}
                      value={values.end_at}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          end_at: event.target.value,
                        }))
                      }
                    />
                    {errors.end_at ? <FieldError>{errors.end_at}</FieldError> : null}
                  </Field>
                </div>
              ) : null}
            </div>

            <div className="space-y-4 rounded-xl border border-border/70 p-4">
              <p className="text-sm font-medium text-foreground">
                {t("notifications.sections.recipients")}
              </p>

              <Field data-invalid={!!errors.recipient_selector_type}>
                <FieldLabel htmlFor="notification-rule-selector">
                  {t("notifications.form.recipientSelector")}
                </FieldLabel>
                <Select
                  value={values.recipient_selector_type}
                  onValueChange={(value) =>
                    value
                      ? setValues((current) => ({
                          ...current,
                          recipient_selector_type:
                            value as NotificationRuleFormValues["recipient_selector_type"],
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
                    id="notification-rule-selector"
                    disabled={isBusy}
                    aria-invalid={!!errors.recipient_selector_type}
                  >
                    <SelectValue>{selectedRecipientSelectorLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {recipientOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {formatRecipientSelectorLabel(t, option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.recipient_selector_type ? (
                  <FieldError>{errors.recipient_selector_type}</FieldError>
                ) : null}
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

            <Field orientation="horizontal" className="rounded-xl border border-border/70 p-4">
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
                {t("common.actions.cancel")}
              </DialogPrimitive.Close>
              <Button type="submit" disabled={isBusy || !hasTemplateOptions}>
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
