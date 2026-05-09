"use client"

import { useSyncExternalStore } from "react"

import Loading from "@/app/loading"
import { ForgotPasswordDialog } from "@/components/auth/signin/forgot-password-dialog"
import { useSigninController } from "@/components/auth/signin/hooks/use-signin-controller"
import { SigninPageView } from "@/components/auth/signin/signin-page-view"
import { SigninTenantDialog } from "@/components/auth/signin/signin-tenant-dialog"

export default function SigninPage() {
  const { dialog, recovery, view } = useSigninController()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return <Loading />
  }

  return (
    <>
      <SigninPageView {...view} />
      <SigninTenantDialog {...dialog} />
      <ForgotPasswordDialog {...recovery} />
    </>
  )
}
