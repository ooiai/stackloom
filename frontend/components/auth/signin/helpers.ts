import type { TranslateFn } from "@/lib/i18n"
import CryptUtil from "@/lib/crypt"
import type { SigninTenantOption } from "@/types/auth.types"
import type { SliderCaptcha } from "@/types/system.types"
import { z } from "zod"

export type SigninFormValues = {
  account: string
  password: string
}

export type SigninFormErrors = Partial<Record<keyof SigninFormValues, string>>

export const DEFAULT_SIGNIN_VALUES: SigninFormValues = {
  account: "",
  password: "",
}

const DASHBOARD_ROUTE = "/upms/users"
const WEB_HOME_ROUTE = "/"

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

export function resolveSigninRoute(tenant: SigninTenantOption) {
  return tenant.role_codes.includes("WEB::GUEST")
    ? WEB_HOME_ROUTE
    : DASHBOARD_ROUTE
}
