"use client"

import { useCallback, useMemo } from "react"

import {
  buildPermissionSet,
  hasAllPerms as checkAllPerms,
  hasAnyPerm as checkAnyPerm,
  hasPerm as checkPerm,
  type PermissionCode,
} from "@/lib/permissions"
import { useHeaderContext } from "@/hooks/use-header-context"
import { useI18n } from "@/providers/i18n-provider"
import { toast } from "sonner"

interface PermissionGuardOptions {
  source: string
}

function logPermissionDenied(source: string, codes: readonly PermissionCode[]) {
  console.warn("[permissions] blocked frontend action", {
    source,
    required: codes,
  })
}

export function usePermissionAccess() {
  const headerContext = useHeaderContext()
  const { t } = useI18n()

  const permSet = useMemo(
    () => buildPermissionSet(headerContext.permCodes),
    [headerContext.permCodes]
  )
  const isReady = headerContext.status === "success"
  const isLoading =
    !isReady && (headerContext.isPending || headerContext.isFetching)

  const hasPerm = useCallback(
    (code: PermissionCode) => isReady && checkPerm(permSet, code),
    [isReady, permSet]
  )

  const hasAnyPerm = useCallback(
    (codes: readonly PermissionCode[]) => isReady && checkAnyPerm(permSet, codes),
    [isReady, permSet]
  )

  const hasAllPerms = useCallback(
    (codes: readonly PermissionCode[]) =>
      isReady && checkAllPerms(permSet, codes),
    [isReady, permSet]
  )

  const guardPerm = useCallback(
    (code: PermissionCode, options: PermissionGuardOptions) => {
      if (!isReady) {
        return false
      }

      if (checkPerm(permSet, code)) {
        return true
      }

      toast.warning(t("errors.http.forbidden"))
      logPermissionDenied(options.source, [code])
      return false
    },
    [isReady, permSet, t]
  )

  const guardAnyPerm = useCallback(
    (codes: readonly PermissionCode[], options: PermissionGuardOptions) => {
      if (!isReady) {
        return false
      }

      if (checkAnyPerm(permSet, codes)) {
        return true
      }

      toast.warning(t("errors.http.forbidden"))
      logPermissionDenied(options.source, codes)
      return false
    },
    [isReady, permSet, t]
  )

  const guardAllPerms = useCallback(
    (codes: readonly PermissionCode[], options: PermissionGuardOptions) => {
      if (!isReady) {
        return false
      }

      if (checkAllPerms(permSet, codes)) {
        return true
      }

      toast.warning(t("errors.http.forbidden"))
      logPermissionDenied(options.source, codes)
      return false
    },
    [isReady, permSet, t]
  )

  return {
    ...headerContext,
    permSet,
    isReady,
    isLoading,
    hasPerm,
    hasAnyPerm,
    hasAllPerms,
    guardPerm,
    guardAnyPerm,
    guardAllPerms,
  }
}
