"use client"

import { useCallback, useState } from "react"

import { invalidateHeaderSharedQueries } from "@/hooks/use-header-context"
import { useI18n } from "@/providers/i18n-provider"
import { roleApi, menuApi } from "@/stores/base-api"
import type { RoleData } from "@/types/base.types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface AssignMenusDialogState {
  open: boolean
  role: RoleData | null
}

const DEFAULT_STATE: AssignMenusDialogState = {
  open: false,
  role: null,
}

export function useRoleAssignMenus() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const [dialog, setDialog] = useState<AssignMenusDialogState>(DEFAULT_STATE)

  const menusQuery = useQuery({
    queryKey: ["base", "menus", "tree"],
    queryFn: () => menuApi.tree({}),
    enabled: dialog.open,
  })

  const assignedQuery = useQuery({
    queryKey: ["base", "roles", "menus", dialog.role?.id],
    queryFn: () => roleApi.getMenus({ role_id: dialog.role!.id }),
    enabled: dialog.open && dialog.role != null,
  })

  const assignMutation = useMutation({
    mutationFn: (menuIds: string[]) =>
      roleApi.assignMenus({ role_id: dialog.role!.id, menu_ids: menuIds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["base", "roles", "menus", dialog.role?.id],
      })
      await invalidateHeaderSharedQueries(queryClient)
      toast.success(t("roles.assignMenus.toast.success"))
      setDialog(DEFAULT_STATE)
    },
  })

  const openAssignMenus = useCallback((role: RoleData) => {
    setDialog({ open: true, role })
  }, [])

  const closeAssignMenus = useCallback(() => {
    setDialog(DEFAULT_STATE)
  }, [])

  return {
    assignMenusDialog: {
      open: dialog.open,
      role: dialog.role,
      menus: menusQuery.data?.items ?? [],
      assignedIds: assignedQuery.data?.items ?? [],
      isLoading: menusQuery.isLoading || assignedQuery.isLoading,
      isSaving: assignMutation.isPending,
      onOpen: openAssignMenus,
      onClose: closeAssignMenus,
      onSave: (menuIds: string[]) => assignMutation.mutateAsync(menuIds),
    },
  }
}
