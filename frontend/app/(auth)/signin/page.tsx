"use client"

import { useSigninController } from "@/components/auth/signin/hooks/use-signin-controller"
import { SigninPageView } from "@/components/auth/signin/signin-page-view"
import { SigninTenantDialog } from "@/components/auth/signin/signin-tenant-dialog"

export default function SigninPage() {
  const { dialog, view } = useSigninController()

  return (
    <>
      <SigninPageView {...view} />
      <SigninTenantDialog {...dialog} />
    </>
  )
}
