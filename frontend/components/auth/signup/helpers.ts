import type { TranslateFn } from "@/lib/i18n"
import CryptUtil from "@/lib/crypt"
import type {
  AccountSignupParam,
  AccountSignupResult,
  InviteSignupParam,
  SendSignupCodeParam,
  SignupChannel,
} from "@/types/auth.types"
import type { SliderCaptcha } from "@/types/system.types"
import { z } from "zod"

export type SignupFormValues = {
  contact: string
  captcha: string
  nickname: string
  tenant_name: string
  password: string
  confirmPassword: string
}

export type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>

export const DEFAULT_SIGNUP_VALUES: SignupFormValues = {
  contact: "",
  captcha: "",
  nickname: "",
  tenant_name: "",
  password: "",
  confirmPassword: "",
}

const PHONE_REGEX = /^1[3-9]\d{9}$/
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export function createSignupContactSchema(
  t: TranslateFn,
  channel: SignupChannel
) {
  return channel === "phone"
    ? z
        .string()
        .min(1, t("auth.signup.validation.phoneRequired"))
        .regex(PHONE_REGEX, t("auth.signup.validation.phoneInvalid"))
    : z
        .string()
        .min(1, t("auth.signup.validation.emailRequired"))
        .regex(EMAIL_REGEX, t("auth.signup.validation.emailInvalid"))
}

export function createSignupFormSchema(t: TranslateFn, channel: SignupChannel) {
  const contactSchema = createSignupContactSchema(t, channel)
  return z
    .object({
      contact: contactSchema,
      captcha: z
        .string()
        .length(6, t("auth.signup.validation.captchaLength")),
      nickname: z
        .string()
        .max(100, t("auth.signup.validation.nicknameMax"))
        .optional()
        .or(z.literal("")),
      tenant_name: z
        .string()
        .max(255, t("auth.signup.validation.tenantNameMax"))
        .optional()
        .or(z.literal("")),
      password: z.string().min(8, t("auth.signup.validation.passwordMin")),
      confirmPassword: z
        .string()
        .min(1, t("auth.signup.validation.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.signup.validation.passwordMismatch"),
      path: ["confirmPassword"],
    })
}

export function getSignupFormErrors(error: z.ZodError): SignupFormErrors {
  const nextErrors: SignupFormErrors = {}

  for (const issue of error.issues) {
    const path = issue.path[0] as keyof SignupFormValues | undefined
    if (path && !nextErrors[path]) {
      nextErrors[path] = issue.message
    }
  }

  return nextErrors
}

export function buildSignupCaptchaPayload(
  values: SignupFormValues,
  verifyData: { x: number; y: number }
): SliderCaptcha {
  return {
    account: values.contact.trim(),
    code: JSON.stringify(verifyData),
  }
}

export function buildAccountSignupParam(
  values: SignupFormValues,
  channel: SignupChannel
): AccountSignupParam {
  return {
    channel,
    contact:
      channel === "email"
        ? values.contact.trim().toLowerCase()
        : values.contact.trim(),
    captcha: values.captcha.trim(),
    password: CryptUtil.md5Double(values.password || ""),
    nickname: values.nickname.trim() || undefined,
    tenant_name: values.tenant_name.trim() || undefined,
  }
}

export function buildInviteSignupParam(
  values: SignupFormValues,
  channel: SignupChannel,
  inviteCode: string
): InviteSignupParam {
  return {
    channel,
    contact:
      channel === "email"
        ? values.contact.trim().toLowerCase()
        : values.contact.trim(),
    captcha: values.captcha.trim(),
    password: CryptUtil.md5Double(values.password || ""),
    nickname: values.nickname.trim() || undefined,
    invite_code: inviteCode,
  }
}

export function buildSendSignupCodeParam(
  values: SignupFormValues,
  channel: SignupChannel,
  verifyData: { x: number; y: number }
): SendSignupCodeParam {
  const payload = buildSignupCaptchaPayload(values, verifyData)

  return {
    channel,
    contact:
      channel === "email" ? payload.account.toLowerCase() : payload.account,
    code: payload.code,
  }
}

export function hasSignupResult(
  result: AccountSignupResult | null
): result is AccountSignupResult {
  return result !== null
}
