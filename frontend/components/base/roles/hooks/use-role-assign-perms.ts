"use client"

import { useCallback, useState } from "react"

import { invalidateHeaderSharedQueries } from "@/hooks/use-header-context"
import { useI18n } from "@/providers/i18n-provider"
import { roleApi, permApi } from "@/stores/base-api"
import type { RoleData } from "@/types/base.types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface AssignPermsDialogState {
  open: boolean
  role: RoleData | null
}

const DEFAULT_STATE: AssignPermsDialogState = {
  open: false,
  role: null,
}

export function useRoleAssignPerms() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const [dialog, setDialog] = useState<AssignPermsDialogState>(DEFAULT_STATE)

  const permsQuery = useQuery({
    queryKey: ["base", "perms", "tree"],
    queryFn: () => permApi.tree({}),
    enabled: dialog.open,
  })

  const assignedQuery = useQuery({
    queryKey: ["base", "roles", "perms", dialog.role?.id],
    queryFn: () => roleApi.getPerms({ role_id: dialog.role!.id }),
    enabled: dialog.open && dialog.role != null,
  })

  const assignMutation = useMutation({
    mutationFn: (permIds: string[]) =>
      roleApi.assignPerms({ role_id: dialog.role!.id, perm_ids: permIds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["base", "roles", "perms", dialog.role?.id],
      })
      await invalidateHeaderSharedQueries(queryClient)
      toast.success(t("roles.assignPerms.toast.success"))
      setDialog(DEFAULT_STATE)
    },
  })

  const openAssignPerms = useCallback((role: RoleData) => {
    setDialog({ open: true, role })
  }, [])

  const closeAssignPerms = useCallback(() => {
    setDialog(DEFAULT_STATE)
  }, [])

  return {
    assignPermsDialog: {
      open: dialog.open,
      role: dialog.role,
      perms: permsQuery.data?.items ?? [],
      assignedIds: assignedQuery.data?.items ?? [],
      isLoading: permsQuery.isLoading || assignedQuery.isLoading,
      isSaving: assignMutation.isPending,
      onOpen: openAssignPerms,
      onClose: closeAssignPerms,
      onSave: (permIds: string[]) => assignMutation.mutateAsync(permIds),
    },
  }
}
