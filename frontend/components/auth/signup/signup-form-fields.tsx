"use client"

import { LabelField } from "@/components/topui/label-field"
import PasswordStrengthInput from "@/components/topui/password-strength-input"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useI18n } from "@/providers/i18n-provider"
import type { SignupChannel } from "@/types/auth.types"
import type { SignupFormErrors, SignupFormValues } from "./helpers"

interface SignupFormFieldsProps {
  signupChannel: SignupChannel
  values: SignupFormValues
  errors: SignupFormErrors
  isBusy: boolean
  isSendingCode: boolean
  resendCooldownSeconds: number
  showTenantField: boolean
  inviteTenantName?: string | null
  onSendCode: () => void
  onValueChange: (key: keyof SignupFormValues, value: string) => void
}

export function SignupFormFields({
  signupChannel,
  values,
  errors,
  isBusy,
  isSendingCode,
  resendCooldownSeconds,
  showTenantField,
  inviteTenantName,
  onSendCode,
  onValueChange,
}: SignupFormFieldsProps) {
  const { t } = useI18n()
  const isPhoneSignup = signupChannel === "phone"

  return (
    <>
      <LabelField
        label={
          isPhoneSignup
            ? t("auth.signup.phone.contactLabel")
            : t("auth.signup.email.contactLabel")
        }
        htmlFor="form-signup-contact"
        invalid={!!errors.contact}
        error={errors.contact}
      >
        <Input
          id="form-signup-contact"
          type={isPhoneSignup ? "tel" : "email"}
          placeholder={
            isPhoneSignup
              ? t("auth.signup.phone.contactPlaceholder")
              : t("auth.signup.email.contactPlaceholder")
          }
          autoComplete={isPhoneSignup ? "tel" : "email"}
          disabled={isBusy}
          value={values.contact}
          onChange={(event) => onValueChange("contact", event.target.value)}
        />
      </LabelField>

      <Field data-invalid={!!errors.captcha}>
        <FieldLabel htmlFor="form-signup-captcha">
          {t("auth.signup.captchaLabel")}
        </FieldLabel>
        <div className="flex gap-2">
          <Input
            id="form-signup-captcha"
            type="text"
            inputMode="numeric"
            placeholder={t("auth.signup.captchaPlaceholder")}
            autoComplete="one-time-code"
            disabled={isBusy}
            value={values.captcha}
            onChange={(event) => onValueChange("captcha", event.target.value.trim())}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isBusy || resendCooldownSeconds > 0}
            onClick={onSendCode}
          >
            {isSendingCode ? (
              <Spinner className="size-4" />
            ) : null}
            {resendCooldownSeconds > 0
              ? t("auth.signup.sendCodeCountdown", {
                  seconds: resendCooldownSeconds,
                })
              : t("auth.signup.sendCode")}
          </Button>
        </div>
        {errors.captcha ? <FieldError>{errors.captcha}</FieldError> : null}
      </Field>

      <Field data-invalid={!!errors.nickname}>
        <FieldLabel htmlFor="form-signup-nickname">
          {t("auth.signup.nicknameLabel")}
        </FieldLabel>
        <Input
          id="form-signup-nickname"
          type="text"
          placeholder={t("auth.signup.nicknamePlaceholder")}
          autoComplete="nickname"
          disabled={isBusy}
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
            disabled={isBusy}
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
          disabled={isBusy}
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
          disabled={isBusy}
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
