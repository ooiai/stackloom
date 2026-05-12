"use client"

import { useEffect } from "react"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setStorageItem } from "@/hooks/use-persisted-state"
import { STORAGE_ENUM } from "@/lib/config/enums"
import { useI18n } from "@/providers/i18n-provider"
import { oauthProviderApi } from "@/stores/auth-api"

function OAuthCallbackPageInner() {
  const { t } = useI18n()
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const state = params.get("state")
    const provider = params.get("provider")

    if (!code || !state || !provider) {
      toast.error(t("auth.oauthCallback.invalidToken"))
      router.replace("/signin")
      return
    }

    oauthProviderApi
      .providerExchange(provider, code, state)
      .then((tokenData) => {
        setStorageItem(
          STORAGE_ENUM.TOKEN,
          JSON.stringify(tokenData),
          tokenData.refresh_expires_at
        )
        toast.success(t("auth.oauthCallback.toast.success"))
        router.replace("/upms/users")
      })
      .catch(() => {
        toast.error(t("auth.oauthCallback.exchangeFailed"))
        router.replace("/signin")
      })
  }, [t, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">{t("auth.oauthCallback.storing")}</p>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return <OAuthCallbackPageInner />
}
