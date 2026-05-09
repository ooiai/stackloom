"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import type { VerifyParam } from "rc-slider-captcha"

import CaptchaSlider from "@/components/auth/captcha-slider"
import PasswordStrengthInput from "@/components/topui/password-strength-input"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useI18n } from "@/providers/i18n-provider"
import type {
  ForgotPasswordFormErrors,
  ForgotPasswordFormValues,
} from "./helpers"

interface ForgotPasswordDialogProps {
  open: boolean
  values: ForgotPasswordFormValues
  errors: ForgotPasswordFormErrors
  isSendingCode: boolean
  isResetting: boolean
  resendCooldownSeconds: number
  showSlider: boolean
  onOpenChange: (open: boolean) => void
  onValueChange: (key: keyof ForgotPasswordFormValues, value: string) => void
  onSendCode: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onVerifySuccess: (data: VerifyParam) => Promise<void> | void
  onVerifyError: () => void
}

export function ForgotPasswordDialog({
  open,
  values,
  errors,
  isSendingCode,
  isResetting,
  resendCooldownSeconds,
  showSlider,
  onOpenChange,
  onValueChange,
  onSendCode,
  onSubmit,
  onVerifySuccess,
  onVerifyError,
}: ForgotPasswordDialogProps) {
  const { t } = useI18n()
  const isBusy = isSendingCode || isResetting

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/70 bg-background p-5 shadow-2xl outline-none">
          <div className="mb-4 space-y-1">
            <DialogPrimitive.Title className="text-base font-semibold">
              {t("auth.recovery.title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {t("auth.recovery.description")}
            </DialogPrimitive.Description>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-1">
              <Button
                type="button"
                variant={values.channel === "phone" ? "default" : "ghost"}
                className="h-8"
                disabled={isBusy}
                onClick={() => onValueChange("channel", "phone")}
              >
                {t("auth.recovery.channel.phone")}
              </Button>
              <Button
                type="button"
                variant={values.channel === "email" ? "default" : "ghost"}
                className="h-8"
                disabled={isBusy}
                onClick={() => onValueChange("channel", "email")}
              >
                {t("auth.recovery.channel.email")}
              </Button>
            </div>

            <Field data-invalid={!!errors.account}>
              <FieldLabel htmlFor="forgot-account">
                {values.channel === "phone"
                  ? t("auth.recovery.phoneLabel")
                  : t("auth.recovery.emailLabel")}
              </FieldLabel>
              <Input
                id="forgot-account"
                value={values.account}
                disabled={isBusy}
                onChange={(event) => onValueChange("account", event.target.value)}
                placeholder={
                  values.channel === "phone"
                    ? t("auth.recovery.phonePlaceholder")
                    : t("auth.recovery.emailPlaceholder")
                }
              />
              {errors.account ? <FieldError>{errors.account}</FieldError> : null}
            </Field>

            <Field data-invalid={!!errors.captcha}>
              <FieldLabel htmlFor="forgot-captcha">
                {t("auth.recovery.captchaLabel")}
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="forgot-captcha"
                  value={values.captcha}
                  disabled={isBusy}
                  onChange={(event) =>
                    onValueChange("captcha", event.target.value.trim())
                  }
                  placeholder={t("auth.recovery.captchaPlaceholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy || resendCooldownSeconds > 0}
                  onClick={onSendCode}
                >
                  {isSendingCode ? <Spinner className="size-4" /> : null}
                  {resendCooldownSeconds > 0
                    ? t("auth.recovery.sendCodeCountdown", {
                        seconds: resendCooldownSeconds,
                      })
                    : t("auth.recovery.sendCode")}
                </Button>
              </div>
              {errors.captcha ? <FieldError>{errors.captcha}</FieldError> : null}
            </Field>

            {showSlider ? (
              <CaptchaSlider
                account={values.account}
                onVerifySuccess={onVerifySuccess}
                onVerifyError={onVerifyError}
              />
            ) : null}

            <Field data-invalid={!!errors.new_password}>
              <FieldLabel htmlFor="forgot-new-password">
                {t("auth.recovery.newPasswordLabel")}
              </FieldLabel>
              <PasswordStrengthInput
                id="forgot-new-password"
                disabled={isBusy}
                value={values.new_password}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onValueChange("new_password", event.target.value)
                }
                placeholder={t("auth.recovery.newPasswordPlaceholder")}
              />
              {errors.new_password ? (
                <FieldError>{errors.new_password}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={!!errors.confirm_password}>
              <FieldLabel htmlFor="forgot-confirm-password">
                {t("auth.recovery.confirmPasswordLabel")}
              </FieldLabel>
              <Input
                id="forgot-confirm-password"
                type="password"
                disabled={isBusy}
                value={values.confirm_password}
                onChange={(event) =>
                  onValueChange("confirm_password", event.target.value)
                }
                placeholder={t("auth.recovery.confirmPasswordPlaceholder")}
              />
              {errors.confirm_password ? (
                <FieldError>{errors.confirm_password}</FieldError>
              ) : null}
            </Field>

            <div className="flex justify-end gap-2">
              <DialogPrimitive.Close
                render={<Button type="button" variant="outline" />}
                disabled={isBusy}
              >
                {t("auth.recovery.cancel")}
              </DialogPrimitive.Close>
              <Button type="submit" disabled={isBusy}>
                {isResetting ? <Spinner className="size-4" /> : null}
                {t("auth.recovery.submit")}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
