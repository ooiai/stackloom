"use client"

import { SignKeysPageView } from "@/components/base/sign-keys/sign-keys-page-container"
import { useSignKeysController } from "@/components/base/sign-keys/hooks/use-sign-keys-controller"

export default function SignKeysPage() {
  const { view } = useSignKeysController()
  return <SignKeysPageView {...view} />
}
