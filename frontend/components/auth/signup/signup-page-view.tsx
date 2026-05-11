"use client"

import Link from "next/link"

import type { VerifyParam } from "rc-slider-captcha"
import { AlertCircleIcon } from "lucide-react"

import { AuthPageShell } from "@/components/auth/auth-page-shell"
import CaptchaSlider from "@/components/auth/captcha-slider"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useI18n } from "@/providers/i18n-provider"
import type { AccountSignupResult, SignupChannel } from "@/types/auth.types"
import type { SignupFormErrors, SignupFormValues } from "./helpers"
import { SignupFormFields } from "./signup-form-fields"
import { SignupSuccessState } from "./signup-success-state"

interface SignupPageViewProps {
  signupChannel: SignupChannel
  values: SignupFormValues
  errors: SignupFormErrors
  showSlider: boolean
  isBusy: boolean
  isSendingCode: boolean
  isSubmitting: boolean
  resendCooldownSeconds: number
  signupResult: AccountSignupResult | null
  isInviteMode: boolean
  isInviteValidating: boolean
  isInviteInvalid: boolean
  inviteTenantName?: string | null
  signinHref: string
  successSigninHref: string
  switchHref: string
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onSendCode: () => void
  onFieldChange: (key: keyof SignupFormValues, value: string) => void
  onVerifySuccess: (data: VerifyParam) => Promise<void> | void
  onVerifyError: () => void
}

export function SignupPageView({
  signupChannel,
  values,
  errors,
  showSlider,
  isBusy,
  isSendingCode,
  isSubmitting,
  resendCooldownSeconds,
  signupResult,
  isInviteMode,
  isInviteValidating,
  isInviteInvalid,
  inviteTenantName,
  signinHref,
  successSigninHref,
  switchHref,
  onSubmit,
  onSendCode,
  onFieldChange,
  onVerifySuccess,
  onVerifyError,
}: SignupPageViewProps) {
  const { t } = useI18n()
  const isPhoneSignup = signupChannel === "phone"

  return (
    <AuthPageShell
      logoAlt={t("auth.signup.logoAlt")}
      hero="/svg/signup.svg"
      heroAlt={t("auth.signup.heroAlt")}
      heroTitle={t(
        isInviteMode ? "auth.signup.invite.heroTitle" : "auth.signup.heroTitle"
      )}
      heroDescription={t(
        isInviteMode
          ? "auth.signup.invite.heroDescription"
          : isPhoneSignup
            ? "auth.signup.heroDescriptionPhone"
            : "auth.signup.heroDescriptionEmail"
      )}
    >
      {signupResult ? (
        <SignupSuccessState
          result={signupResult}
          signinHref={successSigninHref}
          isInviteMode={isInviteMode}
          signupChannel={signupChannel}
        />
      ) : isInviteMode && isInviteInvalid ? (
        <div className="flex flex-col gap-6 rounded-3xl border border-border/70 bg-background/95 p-6 shadow-sm">
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <AlertCircleIcon className="mt-0.5 size-5 text-destructive" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">
                {t("auth.signup.invite.invalidTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("auth.signup.invite.invalidDescription")}
              </p>
            </div>
          </div>
          <Link
            href={signinHref}
            className="text-sm text-primary underline underline-offset-4"
          >
            {t("auth.signup.signIn")}
          </Link>
        </div>
      ) : (
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">
                {t(
                  isInviteMode
                    ? "auth.signup.invite.title"
                    : isPhoneSignup
                      ? "auth.signup.phone.title"
                      : "auth.signup.email.title"
                )}
              </h1>
              <p className="text-sm text-balance text-muted-foreground">
                {t(
                  isInviteMode
                    ? "auth.signup.invite.subtitle"
                    : isPhoneSignup
                      ? "auth.signup.phone.subtitle"
                      : "auth.signup.email.subtitle"
                )}{" "}
                <Link
                  href={signinHref}
                  className="text-primary underline underline-offset-4"
                >
                  {t("auth.signup.signIn")}
                </Link>
              </p>
              <p className="text-sm text-balance text-muted-foreground">
                <Link
                  href={switchHref}
                  className="text-primary underline underline-offset-4"
                >
                  {t(
                    isPhoneSignup
                      ? "auth.signup.switchToEmail"
                      : "auth.signup.switchToPhone"
                  )}
                </Link>
              </p>
              {isInviteMode ? (
                <p className="text-sm text-balance text-muted-foreground">
                  {isInviteValidating
                    ? t("join.page.loading")
                    : t("auth.signup.invite.description", {
                        name: inviteTenantName ?? "",
                      })}
                </p>
              ) : null}
            </div>

            <SignupFormFields
              signupChannel={signupChannel}
              values={values}
              errors={errors}
              isBusy={isBusy}
              isSendingCode={isSendingCode}
              resendCooldownSeconds={resendCooldownSeconds}
              showTenantField={!isInviteMode}
              inviteTenantName={inviteTenantName}
              onSendCode={onSendCode}
              onValueChange={onFieldChange}
            />

            {showSlider ? (
              <CaptchaSlider
                account={values.contact}
                onVerifySuccess={onVerifySuccess}
                onVerifyError={onVerifyError}
              />
            ) : null}

            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={isBusy || (isInviteMode && (isInviteValidating || isInviteInvalid))}
              >
                {isSubmitting ? <Spinner className="size-4" /> : null}
                {t(
                  isInviteMode
                    ? "auth.signup.invite.submit"
                    : "auth.signup.submit"
                )}
              </Button>
            </Field>

            <div className="text-center text-xs text-balance text-muted-foreground">
              {t("auth.signup.agreementPrefix")}{" "}
              <Link
                className="text-primary underline underline-offset-4"
                href="/terms"
              >
                {t("auth.signup.terms")}
              </Link>{" "}
              {t("auth.signup.and")}{" "}
              <Link
                className="text-primary underline underline-offset-4"
                href="/privacy"
              >
                {t("auth.signup.privacy")}
              </Link>
            </div>
          </FieldGroup>
        </form>
      )}
    </AuthPageShell>
  )
}
