import Link from "next/link"

import { CheckCircle2Icon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"
import type { AccountSignupResult, SignupChannel } from "@/types/auth.types"

interface SignupSuccessStateProps {
  result: AccountSignupResult
  signinHref: string
  isInviteMode: boolean
  signupChannel: SignupChannel
}

export function SignupSuccessState({
  result,
  signinHref,
  isInviteMode,
  signupChannel,
}: SignupSuccessStateProps) {
  const { t } = useI18n()
  const verifiedContactLabel =
    signupChannel === "phone"
      ? t("auth.signup.success.phoneLabel")
      : t("auth.signup.success.emailLabel")

  return (
    <div className="rounded-3xl border border-border/70 bg-background/95 p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
          <CheckCircle2Icon className="size-7" />
        </div>
        <h1 className="text-2xl font-bold">
          {t(
            isInviteMode
              ? "auth.signup.invite.success.title"
              : "auth.signup.success.title"
          )}
        </h1>
        <p className="max-w-sm text-sm text-balance text-muted-foreground">
          {t(
            isInviteMode
              ? "auth.signup.invite.success.description"
              : "auth.signup.success.description"
          )}
        </p>
        </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            {t("auth.signup.success.usernameLabel")}
          </span>
          <span className="font-medium">{result.username}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">{verifiedContactLabel}</span>
          <span className="font-medium">{result.account}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            {t("auth.signup.success.tenantLabel")}
          </span>
          <span className="font-medium">{result.tenant_name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            {t("auth.signup.success.slugLabel")}
          </span>
          <span className="font-mono text-xs">{result.tenant_slug}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href={signinHref}
          className={buttonVariants({ variant: "default", size: "lg" })}
        >
          {t(
            isInviteMode
              ? "auth.signup.invite.success.goSignin"
              : "auth.signup.success.goSignin"
          )}
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          {t("auth.signup.success.goHome")}
        </Link>
      </div>
    </div>
  )
}
