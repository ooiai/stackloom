import type { TranslateFn } from "@/lib/i18n"
import { z } from "zod"

export type ChangePasswordFormValues = {
  current_password: string
  new_password: string
  confirm_password: string
}

export type ChangePasswordFormErrors = Partial<
  Record<keyof ChangePasswordFormValues, string>
>

export const DEFAULT_CHANGE_PASSWORD_VALUES: ChangePasswordFormValues = {
  current_password: "",
  new_password: "",
  confirm_password: "",
}

export function createChangePasswordSchema(t: TranslateFn) {
  return z
    .object({
      current_password: z
        .string()
        .min(8, t("account.passwordDialog.validation.currentPasswordRequired")),
      new_password: z
        .string()
        .min(8, t("account.passwordDialog.validation.newPasswordMin")),
      confirm_password: z
        .string()
        .min(8, t("account.passwordDialog.validation.confirmPasswordRequired")),
    })
    .refine((value) => value.new_password !== value.current_password, {
      message: t("account.passwordDialog.validation.passwordSameAsCurrent"),
      path: ["new_password"],
    })
    .refine((value) => value.new_password === value.confirm_password, {
      message: t("account.passwordDialog.validation.passwordMismatch"),
      path: ["confirm_password"],
    })
}

export function getChangePasswordFormErrors(
  error: z.ZodError
): ChangePasswordFormErrors {
  const nextErrors: ChangePasswordFormErrors = {}

  for (const issue of error.issues) {
    const path = issue.path[0] as keyof ChangePasswordFormValues | undefined
    if (path && !nextErrors[path]) {
      nextErrors[path] = issue.message
    }
  }

  return nextErrors
}
