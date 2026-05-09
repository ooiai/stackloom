import type { TranslateFn } from "@/lib/i18n"
import CryptUtil from "@/lib/crypt"
import type { RecoveryChannel, SigninTenantOption } from "@/types/auth.types"
import type { SliderCaptcha } from "@/types/system.types"
import { z } from "zod"
import { ROUTER_ENUM } from "@/lib/config/enums"

export type SigninFormValues = {
  account: string
  password: string
}

export type SigninFormErrors = Partial<Record<keyof SigninFormValues, string>>

export const DEFAULT_SIGNIN_VALUES: SigninFormValues = {
  account: "",
  password: "",
}

export type ForgotPasswordFormValues = {
  channel: RecoveryChannel
  account: string
  captcha: string
  new_password: string
  confirm_password: string
}

export type ForgotPasswordFormErrors = Partial<
  Record<keyof ForgotPasswordFormValues, string>
>

export const DEFAULT_FORGOT_PASSWORD_VALUES: ForgotPasswordFormValues = {
  channel: "phone",
  account: "",
  captcha: "",
  new_password: "",
  confirm_password: "",
}

export function createSigninFormSchema(t: TranslateFn) {
  return z.object({
    account: z.string().min(1, t("auth.signin.validation.accountRequired")),
    password: z.string().min(8, t("auth.signin.validation.passwordMin")),
  })
}

export function getSigninFormErrors(error: z.ZodError): SigninFormErrors {
  const nextErrors: SigninFormErrors = {}

  for (const issue of error.issues) {
    const path = issue.path[0] as keyof SigninFormValues | undefined
    if (path && !nextErrors[path]) {
      nextErrors[path] = issue.message
    }
  }

  return nextErrors
}

export function buildSigninCaptchaPayload(
  values: SigninFormValues,
  verifyData: { x: number; y: number }
): SliderCaptcha {
  return {
    account: values.account,
    password: CryptUtil.md5Double(values.password || ""),
    code: JSON.stringify(verifyData),
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function resolveSigninRoute(tenant: SigninTenantOption) {
  // Guest users stay on the website entry flow; elevated roles land in the dashboard.
  // return tenant.role_codes.includes("WEB::GUEST")
  //   ? WEB_HOME_ROUTE
  //   : DASHBOARD_ROUTE
  return ROUTER_ENUM.DASHBOARD
}

export function createForgotPasswordSchema(t: TranslateFn) {
  return z
    .object({
      channel: z.enum(["phone", "email"]),
      account: z.string().min(1, t("auth.recovery.validation.accountRequired")),
      captcha: z.string().length(6, t("auth.recovery.validation.captchaLength")),
      new_password: z
        .string()
        .min(8, t("auth.recovery.validation.passwordMin")),
      confirm_password: z
        .string()
        .min(8, t("auth.recovery.validation.confirmPasswordRequired")),
    })
    .refine((value) => value.new_password === value.confirm_password, {
      message: t("auth.recovery.validation.passwordMismatch"),
      path: ["confirm_password"],
    })
}

export function getForgotPasswordFormErrors(
  error: z.ZodError
): ForgotPasswordFormErrors {
  const nextErrors: ForgotPasswordFormErrors = {}

  for (const issue of error.issues) {
    const path = issue.path[0] as keyof ForgotPasswordFormValues | undefined
    if (path && !nextErrors[path]) {
      nextErrors[path] = issue.message
    }
  }

  return nextErrors
}
