"use client"

import PasswordStrengthInput from "@/components/topui/password-strength-input"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/providers/i18n-provider"
import type { SigninFormErrors, SigninFormValues } from "./helpers"

interface SigninFormFieldsProps {
  values: SigninFormValues
  errors: SigninFormErrors
  isLoading: boolean
  onValueChange: (key: keyof SigninFormValues, value: string) => void
  onForgotPassword: () => void
}

export function SigninFormFields({
  values,
  errors,
  isLoading,
  onValueChange,
  onForgotPassword,
}: SigninFormFieldsProps) {
  const { t } = useI18n()

  return (
    <>
      <Field data-invalid={!!errors.account}>
        <FieldLabel htmlFor="form-signin-account">
          {t("auth.signin.accountLabel")}
        </FieldLabel>
        <Input
          id="form-signin-account"
          type="text"
          placeholder={t("auth.signin.accountPlaceholder")}
          autoComplete="username"
          disabled={isLoading}
          value={values.account}
          onChange={(event) => onValueChange("account", event.target.value)}
        />
        {errors.account ? <FieldError>{errors.account}</FieldError> : null}
      </Field>

      <Field data-invalid={!!errors.password}>
        <div className="flex items-center">
          <FieldLabel htmlFor="form-signin-password">
            {t("auth.signin.passwordLabel")}
          </FieldLabel>
          <button
            type="button"
            onClick={onForgotPassword}
            className="ml-auto text-sm underline-offset-4 hover:underline"
          >
            {t("auth.signin.forgotPassword")}
          </button>
        </div>
        <PasswordStrengthInput
          id="form-signin-password"
          placeholder={t("auth.signin.passwordPlaceholder")}
          autoComplete="current-password"
          disabled={isLoading}
          value={values.password}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onValueChange("password", event.target.value)
          }
        />
        {errors.password ? <FieldError>{errors.password}</FieldError> : null}
      </Field>
    </>
  )
}
