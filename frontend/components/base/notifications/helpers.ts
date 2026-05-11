import type { TranslateFn } from "@/lib/i18n"
import type {
  CreateNotificationRuleParam,
  CreateNotificationTemplateParam,
  NotificationDispatchData,
  NotificationRecipientSelectorType,
  NotificationRuleData,
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
}

export interface NotificationSendFormValues {
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
  event_code: string
  template_id: string
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

export const DEFAULT_SEND_FORM_VALUES: NotificationSendFormValues = {
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
  event_code: "",
  template_id: "",
  recipient_selector_type: "tenant_admins",
  recipient_user_ids: [],
  enabled: true,
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function createNotificationSendSchema(t: TranslateFn) {
  return z
    .object({
      title: z.string().trim().min(1, t("notifications.validation.titleRequired")),
      body: z.string().trim().min(1, t("notifications.validation.bodyRequired")),
      action_url: z.string().trim().max(500, t("notifications.validation.actionUrlLength")).optional(),
      recipient_selector_type: z.enum(["tenant_all", "tenant_admins", "explicit_users"]),
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
    code: z.string().trim().min(1, t("notifications.validation.codeRequired")).max(80),
    name: z.string().trim().min(1, t("notifications.validation.nameRequired")).max(120),
    event_code: z.string().trim().max(120).optional(),
    locale: z.string().trim().min(1, t("notifications.validation.localeRequired")).max(16),
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
      name: z.string().trim().min(1, t("notifications.validation.nameRequired")).max(120),
      event_code: z
        .string()
        .trim()
        .min(1, t("notifications.validation.eventCodeRequired"))
        .max(120),
      template_id: z
        .string()
        .trim()
        .min(1, t("notifications.validation.templateRequired")),
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

export function buildSendNotificationParam(
  values: NotificationSendFormValues
): SendNotificationParam {
  return {
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
    event_code: values.event_code.trim(),
    template_id: values.template_id,
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
    event_code: rule.event_code,
    template_id: rule.template_id,
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

export function buildNotificationSummary(dispatch: NotificationDispatchData) {
  return dispatch.event_code ? `${dispatch.title} · ${dispatch.event_code}` : dispatch.title
}
