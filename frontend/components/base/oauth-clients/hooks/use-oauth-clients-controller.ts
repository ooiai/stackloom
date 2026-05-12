"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { usePermissionAccess } from "@/hooks/use-permission-access"
import { useAlertDialog } from "@/providers/dialog-providers"
import { useI18n } from "@/providers/i18n-provider"
import { oauthClientApi } from "@/stores/base-api"
import type {
  OAuthClientData,
  OAuthClientFormValues,
  OAuthClientMutateMode,
} from "@/types/base.types"
import {
  buildCreateParam,
  buildUpdateParam,
  OAUTH_CLIENT_ACTION_PERMS,
} from "../helpers"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type { PaginationState } from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

interface OAuthClientSheetState {
  mode: OAuthClientMutateMode
  open: boolean
  client: OAuthClientData | null
}

interface SecretDialogState {
  open: boolean
  mode: "create" | "rotate"
  clientId?: string
  clientSecret: string
}

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SHEET_STATE: OAuthClientSheetState = {
  mode: "create",
  open: false,
  client: null,
}
const DEFAULT_SECRET_DIALOG_STATE: SecretDialogState = {
  open: false,
  mode: "create",
  clientId: undefined,
  clientSecret: "",
}

function parsePageNumber(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

function parsePageSize(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) return fallback
  return Math.floor(parsed)
}

export function useOAuthClientsController() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dialog = useAlertDialog()
  const queryClient = useQueryClient()
  const { hasPerm, guardPerm } = usePermissionAccess()

  const [keyword, setKeyword] = useState<string>(
    () => searchParams.get("keyword")?.trim() ?? ""
  )
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: parsePageNumber(searchParams.get("page"), 1) - 1,
    pageSize: parsePageSize(searchParams.get("size"), DEFAULT_PAGE_SIZE),
  }))
  const [sheet, setSheet] = useState<OAuthClientSheetState>(DEFAULT_SHEET_STATE)
  const [secretDialog, setSecretDialog] = useState<SecretDialogState>(
    DEFAULT_SECRET_DIALOG_STATE
  )

  const debouncedKeyword = useDebouncedValue(keyword, 300)

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedKeyword) params.set("keyword", debouncedKeyword)
    if (pagination.pageIndex > 0) params.set("page", String(pagination.pageIndex + 1))
    if (pagination.pageSize !== DEFAULT_PAGE_SIZE)
      params.set("size", String(pagination.pageSize))
    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    })
  }, [debouncedKeyword, pagination.pageIndex, pagination.pageSize, pathname, router])

  const pageParams = useMemo(
    () => ({
      keyword: debouncedKeyword || undefined,
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    }),
    [debouncedKeyword, pagination.pageIndex, pagination.pageSize]
  )

  const clientsQuery = useQuery({
    queryKey: ["base", "oauth-clients", pageParams],
    queryFn: () => oauthClientApi.page(pageParams),
    placeholderData: keepPreviousData,
  })

  const createMutation = useMutation({
    mutationFn: (values: OAuthClientFormValues) =>
      oauthClientApi.create(buildCreateParam(values)),
    onSuccess: async (data) => {
      setSecretDialog({
        open: true,
        mode: "create",
        clientId: data.client_id,
        clientSecret: data.client_secret,
      })
      await queryClient.invalidateQueries({ queryKey: ["base", "oauth-clients"] })
      toast.success(t("oauth-clients.toast.created"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: OAuthClientFormValues }) =>
      oauthClientApi.update(buildUpdateParam(id, values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "oauth-clients"] })
      toast.success(t("oauth-clients.toast.updated"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (ids: string[]) => oauthClientApi.remove(ids),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "oauth-clients"] })
      toast.success(t("oauth-clients.toast.deleted"))
    },
  })

  const rotateSecretMutation = useMutation({
    mutationFn: (id: string) => oauthClientApi.rotateSecret({ id }),
    onSuccess: (data) => {
      setSecretDialog({
        open: true,
        mode: "rotate",
        clientId: undefined,
        clientSecret: data.client_secret,
      })
      toast.success(t("oauth-clients.toast.rotated"))
    },
  })

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const openCreate = useCallback(() => {
    if (
      !guardPerm(OAUTH_CLIENT_ACTION_PERMS.create, {
        source: "oauth-clients.create.open",
      })
    )
      return
    setSheet({ mode: "create", open: true, client: null })
  }, [guardPerm])

  const openEdit = useCallback(
    (client: OAuthClientData) => {
      if (
        !guardPerm(OAUTH_CLIENT_ACTION_PERMS.update, {
          source: "oauth-clients.update.open",
        })
      )
        return
      setSheet({ mode: "update", open: true, client })
    },
    [guardPerm]
  )

  const closeSheet = useCallback(() => {
    setSheet(DEFAULT_SHEET_STATE)
  }, [])

  const submitSheet = useCallback(
    async (values: OAuthClientFormValues) => {
      if (sheet.mode === "create") {
        if (
          !guardPerm(OAUTH_CLIENT_ACTION_PERMS.create, {
            source: "oauth-clients.create.submit",
          })
        )
          return
        await createMutation.mutateAsync(values)
        return
      }

      if (!sheet.client) return

      if (
        !guardPerm(OAUTH_CLIENT_ACTION_PERMS.update, {
          source: "oauth-clients.update.submit",
        })
      )
        return

      await updateMutation.mutateAsync({ id: sheet.client.id, values })
    },
    [createMutation, guardPerm, sheet.mode, sheet.client, updateMutation]
  )

  const confirmRotateSecret = useCallback(
    (client: OAuthClientData) => {
      if (
        !guardPerm(OAUTH_CLIENT_ACTION_PERMS.rotateSecret, {
          source: "oauth-clients.rotateSecret.confirm",
        })
      )
        return
      rotateSecretMutation.mutate(client.id)
    },
    [guardPerm, rotateSecretMutation]
  )

  const confirmRemove = useCallback(
    (client: OAuthClientData) => {
      if (
        !guardPerm(OAUTH_CLIENT_ACTION_PERMS.remove, {
          source: "oauth-clients.remove.confirm",
        })
      )
        return

      dialog.show({
        variant: "destructive",
        title: t("oauth-clients.actions.deleteConfirmTitle"),
        description: t("oauth-clients.actions.deleteConfirmDescription", {
          name: client.name,
        }),
        confirmText: t("common.actions.delete"),
        cancelText: t("common.actions.cancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await removeMutation.mutateAsync([client.id])
        },
      })
    },
    [dialog, guardPerm, removeMutation, t]
  )

  const closeSecretDialog = useCallback(() => {
    setSecretDialog(DEFAULT_SECRET_DIALOG_STATE)
  }, [])

  const permissions = useMemo(
    () => ({
      canCreate: hasPerm(OAUTH_CLIENT_ACTION_PERMS.create),
      canEdit: hasPerm(OAUTH_CLIENT_ACTION_PERMS.update),
      canRotateSecret: hasPerm(OAUTH_CLIENT_ACTION_PERMS.rotateSecret),
      canDelete: hasPerm(OAUTH_CLIENT_ACTION_PERMS.remove),
      hasAnyRowAction:
        hasPerm(OAUTH_CLIENT_ACTION_PERMS.update) ||
        hasPerm(OAUTH_CLIENT_ACTION_PERMS.rotateSecret) ||
        hasPerm(OAUTH_CLIENT_ACTION_PERMS.remove),
    }),
    [hasPerm]
  )

  return {
    view: {
      permissions,
      keyword,
      clients: clientsQuery.data?.items ?? [],
      total: clientsQuery.data?.total ?? 0,
      isFetching: clientsQuery.isFetching,
      pagination,
      onPaginationChange: setPagination,
      onKeywordChange: handleKeywordChange,
      onRefresh: () => {
        void clientsQuery.refetch()
      },
      onOpenCreate: openCreate,
      onOpenEdit: openEdit,
      onRotateSecret: confirmRotateSecret,
      onDelete: confirmRemove,
    },
    sheet: {
      ...sheet,
      isSubmitting: createMutation.isPending || updateMutation.isPending,
      onClose: closeSheet,
      onSubmit: submitSheet,
    },
    secretDialog: {
      ...secretDialog,
      onClose: closeSecretDialog,
    },
  }
}
