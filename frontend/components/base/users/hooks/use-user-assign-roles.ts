"use client"

import { useCallback, useState } from "react"

import { invalidateHeaderSharedQueries } from "@/hooks/use-header-context"
import { useI18n } from "@/providers/i18n-provider"
import { userApi } from "@/stores/base-api"
import type { UserData } from "@/types/base.types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface AssignRolesDialogState {
  open: boolean
  user: UserData | null
}

const DEFAULT_STATE: AssignRolesDialogState = {
  open: false,
  user: null,
}

export function useUserAssignRoles() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const [dialog, setDialog] = useState<AssignRolesDialogState>(DEFAULT_STATE)

  const rolesQuery = useQuery({
    queryKey: ["base", "users", "roles", dialog.user?.id],
    queryFn: () => userApi.getRoles({ user_id: dialog.user!.id }),
    enabled: dialog.open && dialog.user != null,
  })

  const assignMutation = useMutation({
    mutationFn: (roleIds: string[]) =>
      userApi.assignRoles({ user_id: dialog.user!.id, role_ids: roleIds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["base", "users", "roles", dialog.user?.id],
      })
      await invalidateHeaderSharedQueries(queryClient)
      toast.success(t("users.assignRoles.toast.success"))
      setDialog(DEFAULT_STATE)
    },
  })

  const openAssignRoles = useCallback((user: UserData) => {
    setDialog({ open: true, user })
  }, [])

  const closeAssignRoles = useCallback(() => {
    setDialog(DEFAULT_STATE)
  }, [])

  return {
    assignRolesDialog: {
      open: dialog.open,
      user: dialog.user,
      roles: rolesQuery.data?.items ?? [],
      isLoading: rolesQuery.isLoading,
      isSaving: assignMutation.isPending,
      onOpen: openAssignRoles,
      onClose: closeAssignRoles,
      onSave: (roleIds: string[]) => assignMutation.mutateAsync(roleIds),
    },
  }
}
