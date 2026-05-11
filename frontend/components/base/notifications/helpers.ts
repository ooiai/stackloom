import type { AppLocale, TranslateFn } from "@/lib/i18n"
import type {
  CreateNotificationRuleParam,
  CreateNotificationTemplateParam,
  NotificationCatchupPolicy,
  NotificationDispatchData,
  NotificationRecipientSelectorType,
  NotificationRuleData,
  NotificationRuleTriggerMode,
  NotificationScheduleKind,
  NotificationTemplateData,
  NotificationTriggerType,
  SendNotificationParam,
  UpdateNotificationRuleParam,
  UpdateNotificationTemplateParam,
} from "@/types/base.types"
import { z } from "zod"

export type NotificationsPanel = "dispatches" | "templates" | "rules"

export interface NotificationUserOption {
  id: string
  label: string
}

export interface NotificationTemplateOption {
  id: string
  label: string
  title_template: string
  body_template: string
  action_url_template: string
}

export interface NotificationSendFormValues {
  template_id: string
  title: string
  body: string
  action_url: string
  recipient_selector_type: Exclude<
    NotificationRecipientSelectorType,
    "actor"
  >
  recipient_user_ids: string[]
}

export interface NotificationTemplateFormValues {
  code: string
  name: string
  event_code: string
  locale: string
  title_template: string
  body_template: string
  action_url_template: string
  status: 0 | 1
}

export interface NotificationRuleFormValues {
  name: string
  trigger_mode: NotificationRuleTriggerMode
  event_code: string
  template_id: string
  delay_seconds: string
  schedule_kind: NotificationScheduleKind
  schedule_time: string
  schedule_weekdays: number[]
  cron_expression: string
  start_at: string
  end_at: string
  timezone: string
  catchup_policy: NotificationCatchupPolicy
  recipient_selector_type: NotificationRecipientSelectorType
  recipient_user_ids: string[]
  enabled: boolean
}

export type FormErrors<T extends string> = Partial<Record<T, string>>

export const PANEL_OPTIONS: Array<{
  value: NotificationsPanel
  countKey: "dispatchCount" | "templateCount" | "ruleCount"
}> = [
  { value: "dispatches", countKey: "dispatchCount" },
  { value: "templates", countKey: "templateCount" },
  { value: "rules", countKey: "ruleCount" },
]

export function parseNotificationsPanel(
  value: string | null | undefined
): NotificationsPanel {
  return PANEL_OPTIONS.some((item) => item.value === value)
    ? (value as NotificationsPanel)
    : "dispatches"
}

export const RECIPIENT_SELECTOR_OPTIONS: Array<{
  value: Exclude<NotificationRecipientSelectorType, "actor">
}> = [
  { value: "tenant_all" },
  { value: "tenant_admins" },
  { value: "explicit_users" },
]

export const RULE_RECIPIENT_SELECTOR_OPTIONS: Array<{
  value: NotificationRecipientSelectorType
}> = [
  { value: "tenant_all" },
  { value: "tenant_admins" },
  { value: "explicit_users" },
  { value: "actor" },
]

export const RULE_TRIGGER_MODE_OPTIONS: Array<{
  value: NotificationRuleTriggerMode
}> = [
  { value: "event" },
  { value: "delay_once" },
  { value: "fixed_schedule" },
  { value: "cron_expression" },
]

export const RULE_SCHEDULE_KIND_OPTIONS: Array<{
  value: NotificationScheduleKind
}> = [{ value: "daily" }, { value: "weekly" }]

export const RULE_WEEKDAY_OPTIONS = [
  { value: 1, key: "monday" },
  { value: 2, key: "tuesday" },
  { value: 3, key: "wednesday" },
  { value: 4, key: "thursday" },
  { value: 5, key: "friday" },
  { value: 6, key: "saturday" },
  { value: 7, key: "sunday" },
] as const

export const DEFAULT_SEND_FORM_VALUES: NotificationSendFormValues = {
  template_id: "",
  title: "",
  body: "",
  action_url: "",
  recipient_selector_type: "tenant_all",
  recipient_user_ids: [],
}

export const DEFAULT_TEMPLATE_FORM_VALUES: NotificationTemplateFormValues = {
  code: "",
  name: "",
  event_code: "",
  locale: "zh-CN",
  title_template: "",
  body_template: "",
  action_url_template: "",
  status: 1,
}

export const DEFAULT_RULE_FORM_VALUES: NotificationRuleFormValues = {
  name: "",
  trigger_mode: "event",
  event_code: "",
  template_id: "",
  delay_seconds: "",
  schedule_kind: "daily",
  schedule_time: "",
  schedule_weekdays: [],
  cron_expression: "",
  start_at: "",
  end_at: "",
  timezone: "Asia/Shanghai",
  catchup_policy: "fire_once",
  recipient_selector_type: "tenant_admins",
  recipient_user_ids: [],
  enabled: true,
}

const NOTIFICATION_LOCALE_LABEL_KEYS: Record<AppLocale, string> = {
  "zh-CN": "notifications.localeOptions.zhCN",
  "en-US": "notifications.localeOptions.enUS",
}

export const NOTIFICATION_TEMPLATE_LOCALES = Object.keys(
  NOTIFICATION_LOCALE_LABEL_KEYS
) as AppLocale[]

function normalizeOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeDateTimeLocal(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return ""
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const pad = (item: number) => item.toString().padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function createNotificationSendSchema(t: TranslateFn) {
  return z
    .object({
      template_id: z.string(),
      title: z
        .string()
        .trim()
        .min(1, t("notifications.validation.titleRequired")),
      body: z.string().trim().min(1, t("notifications.validation.bodyRequired")),
      action_url: z
        .string()
        .trim()
        .max(500, t("notifications.validation.actionUrlLength"))
        .optional(),
      recipient_selector_type: z.enum([
        "tenant_all",
        "tenant_admins",
        "explicit_users",
      ]),
      recipient_user_ids: z.array(z.string()),
    })
    .superRefine((value, ctx) => {
      if (
        value.recipient_selector_type === "explicit_users" &&
        value.recipient_user_ids.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipient_user_ids"],
          message: t("notifications.validation.recipientUsersRequired"),
        })
      }
    })
}

export function createNotificationTemplateSchema(t: TranslateFn) {
  return z.object({
    code: z
      .string()
      .trim()
      .min(1, t("notifications.validation.codeRequired"))
      .max(80),
    name: z
      .string()
      .trim()
      .min(1, t("notifications.validation.nameRequired"))
      .max(120),
    event_code: z.string().trim().max(120).optional(),
    locale: z
      .string()
      .trim()
      .min(1, t("notifications.validation.localeRequired"))
      .max(16),
    title_template: z
      .string()
      .trim()
      .min(1, t("notifications.validation.titleTemplateRequired"))
      .max(200),
    body_template: z
      .string()
      .trim()
      .min(1, t("notifications.validation.bodyTemplateRequired"))
      .max(20000),
    action_url_template: z.string().trim().max(500).optional(),
    status: z.union([z.literal(0), z.literal(1)]),
  })
}

export function createNotificationRuleSchema(t: TranslateFn) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t("notifications.validation.nameRequired"))
        .max(120),
      trigger_mode: z.enum([
        "event",
        "delay_once",
        "fixed_schedule",
        "cron_expression",
      ]),
      event_code: z.string().trim().max(120).optional(),
      template_id: z
        .string()
        .trim()
        .min(1, t("notifications.validation.templateRequired")),
      delay_seconds: z.string(),
      schedule_kind: z.enum(["daily", "weekly"]),
      schedule_time: z.string(),
      schedule_weekdays: z.array(z.number().int().min(1).max(7)),
      cron_expression: z.string(),
      start_at: z.string(),
      end_at: z.string(),
      timezone: z.string().trim().min(1),
      catchup_policy: z.enum(["fire_once"]),
      recipient_selector_type: z.enum([
        "tenant_all",
        "tenant_admins",
        "explicit_users",
        "actor",
      ]),
      recipient_user_ids: z.array(z.string()),
      enabled: z.boolean(),
    })
    .superRefine((value, ctx) => {
      if (
        value.recipient_selector_type === "explicit_users" &&
        value.recipient_user_ids.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipient_user_ids"],
          message: t("notifications.validation.recipientUsersRequired"),
        })
      }

      if (
        value.trigger_mode !== "event" &&
        value.recipient_selector_type === "actor"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipient_selector_type"],
          message: t("notifications.validation.actorRecipientEventOnly"),
        })
      }

      if (
        value.trigger_mode === "event" &&
        !(value.event_code ?? "").trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["event_code"],
          message: t("notifications.validation.eventCodeRequired"),
        })
      }

      if (value.trigger_mode === "delay_once") {
        const parsed = normalizeOptionalNumber(value.delay_seconds)
        if (!parsed || parsed <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["delay_seconds"],
            message: t("notifications.validation.delaySecondsRequired"),
          })
        }
      }

      if (value.trigger_mode === "fixed_schedule") {
        if (!value.schedule_time.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["schedule_time"],
            message: t("notifications.validation.scheduleTimeRequired"),
          })
        }

        if (
          value.schedule_kind === "weekly" &&
          value.schedule_weekdays.length === 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["schedule_weekdays"],
            message: t("notifications.validation.scheduleWeekdaysRequired"),
          })
        }
      }

      if (value.trigger_mode === "cron_expression" && !value.cron_expression.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cron_expression"],
          message: t("notifications.validation.cronExpressionRequired"),
        })
      }

      const startAt = normalizeDateTimeLocal(value.start_at)
      const endAt = normalizeDateTimeLocal(value.end_at)
      if (startAt && endAt && new Date(startAt) > new Date(endAt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["end_at"],
          message: t("notifications.validation.endAtAfterStartAt"),
        })
      }
    })
}

export function getFormErrors<T extends string>(error: z.ZodError): FormErrors<T> {
  const flattened = error.flatten().fieldErrors
  const nextErrors: Record<string, string> = {}

  Object.entries(flattened).forEach(([key, value]) => {
    const firstMessage = Array.isArray(value) ? value[0] : undefined
    if (firstMessage) {
      nextErrors[key] = firstMessage
    }
  })

  return nextErrors as FormErrors<T>
}

export function applyTemplateToSendForm(
  current: NotificationSendFormValues,
  template?: NotificationTemplateOption
): NotificationSendFormValues {
  if (!template) {
    return {
      ...current,
      template_id: "",
    }
  }

  return {
    ...current,
    template_id: template.id,
    title: template.title_template,
    body: template.body_template,
    action_url: template.action_url_template,
  }
}

export function buildSendNotificationParam(
  values: NotificationSendFormValues
): SendNotificationParam {
  return {
    template_id: normalizeOptionalText(values.template_id),
    title: values.title.trim(),
    body: values.body.trim(),
    action_url: normalizeOptionalText(values.action_url),
    recipient_selector_type: values.recipient_selector_type,
    recipient_user_ids:
      values.recipient_selector_type === "explicit_users"
        ? values.recipient_user_ids
        : undefined,
  }
}

export function buildCreateTemplateParam(
  values: NotificationTemplateFormValues
): CreateNotificationTemplateParam {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    event_code: normalizeOptionalText(values.event_code),
    locale: values.locale.trim(),
    title_template: values.title_template.trim(),
    body_template: values.body_template.trim(),
    action_url_template: normalizeOptionalText(values.action_url_template),
    status: values.status,
  }
}

export function buildUpdateTemplateParam(
  id: string,
  values: NotificationTemplateFormValues
): UpdateNotificationTemplateParam {
  return {
    id,
    ...buildCreateTemplateParam(values),
  }
}

export function buildCreateRuleParam(
  values: NotificationRuleFormValues
): CreateNotificationRuleParam {
  return {
    name: values.name.trim(),
    trigger_mode: values.trigger_mode,
    event_code: normalizeOptionalText(values.event_code),
    template_id: values.template_id,
    timezone: values.timezone.trim(),
    delay_seconds: normalizeOptionalNumber(values.delay_seconds),
    schedule_kind:
      values.trigger_mode === "fixed_schedule" ? values.schedule_kind : undefined,
    schedule_time:
      values.trigger_mode === "fixed_schedule"
        ? normalizeOptionalText(values.schedule_time)
        : undefined,
    schedule_weekdays:
      values.trigger_mode === "fixed_schedule" &&
      values.schedule_kind === "weekly"
        ? values.schedule_weekdays
        : undefined,
    cron_expression:
      values.trigger_mode === "cron_expression"
        ? normalizeOptionalText(values.cron_expression)
        : undefined,
    start_at: normalizeDateTimeLocal(values.start_at),
    end_at: normalizeDateTimeLocal(values.end_at),
    catchup_policy: values.catchup_policy,
    recipient_selector_type: values.recipient_selector_type,
    recipient_user_ids:
      values.recipient_selector_type === "explicit_users"
        ? values.recipient_user_ids
        : undefined,
    enabled: values.enabled,
  }
}

export function buildUpdateRuleParam(
  id: string,
  values: NotificationRuleFormValues
): UpdateNotificationRuleParam {
  return {
    id,
    ...buildCreateRuleParam(values),
  }
}

export function createTemplateFormValues(
  template?: NotificationTemplateData | null
): NotificationTemplateFormValues {
  if (!template) {
    return DEFAULT_TEMPLATE_FORM_VALUES
  }

  return {
    code: template.code,
    name: template.name,
    event_code: template.event_code ?? "",
    locale: template.locale,
    title_template: template.title_template,
    body_template: template.body_template,
    action_url_template: template.action_url_template ?? "",
    status: template.status,
  }
}

export function createRuleFormValues(
  rule?: NotificationRuleData | null
): NotificationRuleFormValues {
  if (!rule) {
    return DEFAULT_RULE_FORM_VALUES
  }

  return {
    name: rule.name,
    trigger_mode: rule.trigger_mode,
    event_code: rule.event_code ?? "",
    template_id: rule.template_id,
    delay_seconds: rule.delay_seconds ? String(rule.delay_seconds) : "",
    schedule_kind: rule.schedule_kind ?? "daily",
    schedule_time: rule.schedule_time ?? "",
    schedule_weekdays: rule.schedule_weekdays ?? [],
    cron_expression: rule.cron_expression ?? "",
    start_at: toDateTimeLocalValue(rule.start_at),
    end_at: toDateTimeLocalValue(rule.end_at),
    timezone: rule.timezone,
    catchup_policy: rule.catchup_policy,
    recipient_selector_type: rule.recipient_selector_type,
    recipient_user_ids: rule.recipient_user_ids ?? [],
    enabled: rule.enabled,
  }
}

export function formatRecipientSelectorLabel(
  t: TranslateFn,
  selector: NotificationRecipientSelectorType
) {
  return t(`notifications.selector.${selector}`)
}

export function formatTriggerTypeLabel(
  t: TranslateFn,
  triggerType: NotificationTriggerType
) {
  return t(`notifications.trigger.${triggerType}`)
}

export function formatRuleTriggerModeLabel(
  t: TranslateFn,
  triggerMode: NotificationRuleTriggerMode
) {
  return t(`notifications.trigger.${triggerMode}`)
}

export function getRuleRecipientSelectorOptions(
  triggerMode: NotificationRuleTriggerMode
) {
  return triggerMode === "event"
    ? RULE_RECIPIENT_SELECTOR_OPTIONS
    : RULE_RECIPIENT_SELECTOR_OPTIONS.filter((option) => option.value !== "actor")
}

export function formatNotificationLocaleLabel(t: TranslateFn, locale: string) {
  const key = NOTIFICATION_LOCALE_LABEL_KEYS[locale as AppLocale]
  return key ? t(key) : locale
}

export function formatNotificationDisplayText(
  t: TranslateFn,
  value: string | null | undefined
) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : t("common.misc.none")
}

export function formatDateTime(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(locale, {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatWeekdayLabel(t: TranslateFn, weekday: number) {
  const option = RULE_WEEKDAY_OPTIONS.find((item) => item.value === weekday)
  return option ? t(`notifications.weekdays.${option.key}`) : String(weekday)
}

export function formatRuleScheduleSummary(
  t: TranslateFn,
  rule: NotificationRuleData
) {
  switch (rule.trigger_mode) {
    case "event":
      return rule.event_code
        ? t("notifications.scheduleSummary.event", {
            eventCode: rule.event_code,
          })
        : t("notifications.scheduleSummary.eventEmpty")
    case "delay_once":
      return t("notifications.scheduleSummary.delayOnce", {
        seconds: String(rule.delay_seconds ?? 0),
      })
    case "fixed_schedule":
      if (rule.schedule_kind === "weekly") {
        return t("notifications.scheduleSummary.fixedWeekly", {
          time: rule.schedule_time ?? "--:--",
          weekdays: (rule.schedule_weekdays ?? [])
            .map((weekday) => formatWeekdayLabel(t, weekday))
            .join(", "),
        })
      }
      return t("notifications.scheduleSummary.fixedDaily", {
        time: rule.schedule_time ?? "--:--",
      })
    case "cron_expression":
      return t("notifications.scheduleSummary.cron", {
        cron: rule.cron_expression ?? "* * * * *",
      })
  }
}

export function buildNotificationSummary(dispatch: NotificationDispatchData) {
  return dispatch.event_code ? `${dispatch.title} · ${dispatch.event_code}` : dispatch.title
}
