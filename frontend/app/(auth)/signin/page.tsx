"use client"

import Loading from "@/app/loading"
import { useSigninController } from "@/components/auth/signin/hooks/use-signin-controller"
import { SigninPageView } from "@/components/auth/signin/signin-page-view"
import { SigninTenantDialog } from "@/components/auth/signin/signin-tenant-dialog"
import { Suspense } from "react"

export default function SigninPage() {
  const { dialog, view } = useSigninController()

  return (
    <Suspense fallback={<Loading />}>
      <SigninPageView {...view} />
      <SigninTenantDialog {...dialog} />
    </Suspense>
  )
}
