"use client"

import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  LogIn,
  UserPlus,
} from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useI18n } from "@/providers/i18n-provider"
import type { useJoinController } from "./hooks/use-join-controller"

type JoinPageViewProps = ReturnType<typeof useJoinController>

export function JoinPageView({
  inviteCode,
  isValidating,
  isInvalidCode,
  tenantInfo,
  isAuthenticated,
  isJoining,
  isJoinSuccess,
  alreadyMember,
  alreadyPending,
  handleJoin,
  handleGoToDashboard,
  handleSignup,
}: JoinPageViewProps) {
  const { t } = useI18n()

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Loading state */}
        {isValidating && inviteCode && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <Spinner className="size-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                {t("join.page.loading")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Invalid / missing code */}
        {!isValidating && isInvalidCode && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {t("join.page.invalidTitle")}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t("join.page.invalidDescription")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already a member */}
        {!isValidating && !isInvalidCode && alreadyMember && tenantInfo && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="size-8 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {t("join.page.alreadyMember")}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t("join.page.alreadyMemberDescription", {
                    name: tenantInfo.tenant_name,
                  })}
                </p>
              </div>
              <Button onClick={handleJoin} className="mt-2 gap-2">
                {t("join.page.goToDashboard")}
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Existing pending request */}
        {!isValidating && !isInvalidCode && alreadyPending && tenantInfo && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-warning/10">
                <Clock3 className="size-8 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {t("join.page.pendingTitle")}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t("join.page.pendingDescription", {
                    name: tenantInfo.tenant_name,
                  })}
                </p>
              </div>
              <Button onClick={handleGoToDashboard} className="mt-2 gap-2">
                {t("join.page.goToDashboard")}
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success state */}
        {!isValidating &&
          isJoinSuccess &&
          tenantInfo &&
          !alreadyMember &&
          !alreadyPending && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="size-8 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {t("join.page.successTitle")}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t("join.page.successDescription", {
                    name: tenantInfo.tenant_name,
                  })}
                </p>
              </div>
              <Spinner className="size-5 text-primary" />
            </CardContent>
          </Card>
        )}

        {/* Valid invite — preview + join */}
        {!isValidating &&
          !isInvalidCode &&
          !isJoinSuccess &&
          !alreadyMember &&
          !alreadyPending &&
          tenantInfo && (
            <Card>
              <CardContent className="py-10">
                <div className="flex flex-col items-center gap-6 text-center">
                  {/* Tenant icon */}
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <Building2 className="size-10 text-primary" />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("join.page.previewTitle")}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight">
                      {tenantInfo.tenant_name}
                    </h1>
                    <Badge variant="outline" className="mt-2 font-mono text-xs">
                      {tenantInfo.tenant_slug}
                    </Badge>
                  </div>

                  {/* CTA */}
                  {isAuthenticated ? (
                    <Button
                      size="lg"
                      className="mt-2 w-full gap-2"
                      onClick={handleJoin}
                      disabled={isJoining}
                    >
                      {isJoining ? (
                        <Spinner className="size-4" />
                      ) : (
                        <ArrowRight className="size-4" />
                      )}
                      {t("join.page.joinButton", {
                        name: tenantInfo.tenant_name,
                      })}
                    </Button>
                  ) : (
                    <div className="mt-2 w-full space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t("join.page.authDescription")}
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="lg"
                          className="w-full gap-2"
                          onClick={handleJoin}
                        >
                          <LogIn className="size-4" />
                          {t("join.page.signinButton")}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={handleSignup}
                        >
                          <UserPlus className="size-4" />
                          {t("join.page.signupButton")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Skeleton while validating (no code edge case) */}
        {isValidating && !inviteCode && (
          <Card>
            <CardContent className="flex flex-col gap-4 py-10">
              <Skeleton className="mx-auto size-20 rounded-2xl" />
              <Skeleton className="mx-auto h-6 w-40" />
              <Skeleton className="mx-auto h-4 w-24" />
              <Skeleton className="mt-2 h-10 w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
