"use client"

import { useOAuthClientsController } from "@/components/base/oauth-clients/hooks/use-oauth-clients-controller"
import { OAuthClientsPageContainer } from "@/components/base/oauth-clients/oauth-clients-page-container"
import { OAuthClientMutateSheet } from "@/components/base/oauth-clients/oauth-client-mutate-sheet"
import { OAuthClientSecretDialog } from "@/components/base/oauth-clients/oauth-client-secret-dialog"

export default function OAuthClientsPage() {
  const { view, sheet, secretDialog } = useOAuthClientsController()
  return (
    <>
      <OAuthClientsPageContainer {...view} />
      <OAuthClientMutateSheet {...sheet} />
      <OAuthClientSecretDialog {...secretDialog} />
    </>
  )
}
