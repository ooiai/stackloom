"use client"

import Loading from "@/app/loading"
import { useSignupController } from "@/components/auth/signup/hooks/use-signup-controller"
import { SignupPageView } from "@/components/auth/signup/signup-page-view"
import { Suspense } from "react"

export default function SignupPage() {
  const { view } = useSignupController()

  return (
    <Suspense fallback={<Loading />}>
      <SignupPageView {...view} />
    </Suspense>
  )
}
