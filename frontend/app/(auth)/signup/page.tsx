"use client"

import { useSignupController } from "@/components/auth/signup/hooks/use-signup-controller"
import { SignupPageView } from "@/components/auth/signup/signup-page-view"

export default function SignupPage() {
  const { view } = useSignupController()

  return <SignupPageView {...view} />
}
