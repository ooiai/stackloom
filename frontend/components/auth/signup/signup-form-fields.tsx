"use client"

import { LabelField } from "@/components/topui/label-field"
import PasswordStrengthInput from "@/components/topui/password-strength-input"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/providers/i18n-provider"
import type { SignupFormErrors, SignupFormValues } from "./helpers"

interface SignupFormFieldsProps {
  values: SignupFormValues
  errors: SignupFormErrors
  isLoading: boolean
  showTenantField: boolean
  inviteTenantName?: string | null
  onValueChange: (key: keyof SignupFormValues, value: string) => void
}

export function SignupFormFields({
  values,
  errors,
  isLoading,
  showTenantField,
  inviteTenantName,
  onValueChange,
}: SignupFormFieldsProps) {
  const { t } = useI18n()

  return (
    <>
      <LabelField
        label={t("auth.signup.accountLabel")}
        htmlFor="form-signup-account"
        invalid={!!errors.account}
        error={errors.account}
        tooltip={{ content: t("auth.signup.accountHint") }}
      >
        <Input
          id="form-signup-account"
          type="text"
          placeholder={t("auth.signup.accountPlaceholder")}
          autoComplete="username"
          disabled={isLoading}
          value={values.account}
          onChange={(event) => onValueChange("account", event.target.value)}
        />
      </LabelField>

      <Field data-invalid={!!errors.nickname}>
        <FieldLabel htmlFor="form-signup-nickname">
          {t("auth.signup.nicknameLabel")}
        </FieldLabel>
        <Input
          id="form-signup-nickname"
          type="text"
          placeholder={t("auth.signup.nicknamePlaceholder")}
          autoComplete="nickname"
          disabled={isLoading}
          value={values.nickname}
          onChange={(event) => onValueChange("nickname", event.target.value)}
        />
        {errors.nickname ? <FieldError>{errors.nickname}</FieldError> : null}
      </Field>

      {showTenantField ? (
        <LabelField
          label={t("auth.signup.tenantLabel")}
          htmlFor="form-signup-tenant"
          invalid={!!errors.tenant_name}
          error={errors.tenant_name}
          tooltip={{ content: t("auth.signup.tenantHint") }}
        >
          <Input
            id="form-signup-tenant"
            type="text"
            placeholder={t("auth.signup.tenantPlaceholder")}
            disabled={isLoading}
            value={values.tenant_name}
            onChange={(event) => onValueChange("tenant_name", event.target.value)}
          />
        </LabelField>
      ) : (
        <Field>
          <FieldLabel htmlFor="form-signup-invite-tenant">
            {t("auth.signup.invite.tenantLabel")}
          </FieldLabel>
          <Input
            id="form-signup-invite-tenant"
            type="text"
            disabled
            readOnly
            value={inviteTenantName ?? ""}
          />
        </Field>
      )}

      <Field data-invalid={!!errors.password}>
        <FieldLabel htmlFor="form-signup-password">
          {t("auth.signup.passwordLabel")}
        </FieldLabel>
        <PasswordStrengthInput
          id="form-signup-password"
          placeholder={t("auth.signup.passwordPlaceholder")}
          autoComplete="new-password"
          disabled={isLoading}
          value={values.password}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onValueChange("password", event.target.value)
          }
        />
        {errors.password ? <FieldError>{errors.password}</FieldError> : null}
      </Field>

      <Field data-invalid={!!errors.confirmPassword}>
        <FieldLabel htmlFor="form-signup-confirm-password">
          {t("auth.signup.confirmPasswordLabel")}
        </FieldLabel>
        <PasswordStrengthInput
          id="form-signup-confirm-password"
          placeholder={t("auth.signup.confirmPasswordPlaceholder")}
          autoComplete="new-password"
          disabled={isLoading}
          value={values.confirmPassword}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onValueChange("confirmPassword", event.target.value)
          }
        />
        {errors.confirmPassword ? (
          <FieldError>{errors.confirmPassword}</FieldError>
        ) : null}
      </Field>
    </>
  )
}
