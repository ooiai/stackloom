"use client"

import Image from "next/image"
import Link from "next/link"

import { SigninForm } from "@/components/auth/signin-form"
import { useI18n } from "@/providers/i18n-provider"

export default function SigninPage() {
  const { t } = useI18n()

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/svg/logo.svg"
              alt={t("auth.signin.logoAlt")}
              width={0}
              height={0}
              priority
              className="h-auto w-10"
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <SigninForm />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-[#f5f7f9] lg:block">
        <div className="flex h-full w-auto flex-col items-center justify-center">
          <Image
            src="/svg/auth.svg"
            alt={t("auth.signin.heroAlt")}
            width={0}
            height={0}
            priority
            className="mx-auto h-auto w-xl"
          />
          <span className="mt-8 text-xl font-semibold">
            {t("auth.signin.heroTitle")}
          </span>
          <span className="mt-3 max-w-2xl text-sm text-muted-foreground italic">
            {t("auth.signin.heroDescription")}
          </span>
        </div>
      </div>
    </div>
  )
}
