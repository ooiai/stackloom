import type { TranslateFn } from "@/lib/i18n"
import CryptUtil from "@/lib/crypt"
import type {
  SignupAccountParam,
  SignupAccountResult,
} from "@/types/auth.types"
import type { SliderCaptcha } from "@/types/system.types"
import { z } from "zod"

export type SignupFormValues = {
  account: string
  nickname: string
  tenant_name: string
  password: string
  confirmPassword: string
}

export type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>

export const DEFAULT_SIGNUP_VALUES: SignupFormValues = {
  account: "",
  nickname: "",
  tenant_name: "",
  password: "",
  confirmPassword: "",
}

export function createSignupFormSchema(t: TranslateFn) {
  return z
    .object({
      account: z.string().min(1, t("auth.signup.validation.accountRequired")),
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
    account: values.account,
    password: CryptUtil.md5Double(values.password || ""),
    code: JSON.stringify(verifyData),
  }
}

export function buildSignupAccountParam(
  values: SignupFormValues,
  verifyData: { x: number; y: number }
): SignupAccountParam {
  const payload = buildSignupCaptchaPayload(values, verifyData)

  return {
    account: payload.account,
    password: payload.password ?? "",
    code: payload.code,
    nickname: values.nickname.trim() || undefined,
    tenant_name: values.tenant_name.trim() || undefined,
  }
}

export function hasSignupResult(
  result: SignupAccountResult | null
): result is SignupAccountResult {
  return result !== null
}
