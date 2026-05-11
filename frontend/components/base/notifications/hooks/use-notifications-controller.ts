"use client"

import { useMemo, useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useI18n } from "@/providers/i18n-provider"
import { notificationAdminApi, userApi } from "@/stores/base-api"
import type {
  NotificationRuleData,
  NotificationTemplateData,
  UserData,
} from "@/types/base.types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  type NotificationRuleFormValues,
  type NotificationTemplateFormValues,
  PANEL_OPTIONS,
  type NotificationsPanel,
  buildCreateRuleParam,
  buildCreateTemplateParam,
  buildSendNotificationParam,
  buildUpdateRuleParam,
  buildUpdateTemplateParam,
  parseNotificationsPanel,
} from "../helpers"

const DISPATCH_LIMIT = 20
const TEMPLATE_LIMIT = 100
const RULE_LIMIT = 100

interface TemplateDialogState {
  open: boolean
  mode: "create" | "update"
  item: NotificationTemplateData | null
}

interface RuleDialogState {
  open: boolean
  mode: "create" | "update"
  item: NotificationRuleData | null
}

const DEFAULT_TEMPLATE_DIALOG: TemplateDialogState = {
  open: false,
  mode: "create",
  item: null,
}

const DEFAULT_RULE_DIALOG: RuleDialogState = {
  open: false,
  mode: "create",
  item: null,
}

export function useNotificationsController() {
  const { t, locale } = useI18n()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activePanel = useMemo(
    () => parseNotificationsPanel(searchParams.get("panel")),
    [searchParams]
  )
  const [sendOpen, setSendOpen] = useState(false)
  const [templateDialog, setTemplateDialog] = useState<TemplateDialogState>(
    DEFAULT_TEMPLATE_DIALOG
  )
  const [ruleDialog, setRuleDialog] =
    useState<RuleDialogState>(DEFAULT_RULE_DIALOG)

  const handlePanelChange = (panel: NotificationsPanel) => {
    const params = new URLSearchParams(searchParams.toString())
    if (panel === "dispatches") {
      params.delete("panel")
    } else {
      params.set("panel", panel)
    }
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }

  const dispatchesQuery = useQuery({
    queryKey: ["base", "notifications", "dispatches"],
    queryFn: () =>
      notificationAdminApi.pageDispatches({
        limit: DISPATCH_LIMIT,
        offset: 0,
      }),
  })

  const templatesQuery = useQuery({
    queryKey: ["base", "notifications", "templates"],
    queryFn: () =>
      notificationAdminApi.pageTemplates({
        limit: TEMPLATE_LIMIT,
        offset: 0,
      }),
  })

  const rulesQuery = useQuery({
    queryKey: ["base", "notifications", "rules"],
    queryFn: () =>
      notificationAdminApi.pageRules({
        limit: RULE_LIMIT,
        offset: 0,
      }),
  })

  const usersQuery = useQuery({
    queryKey: ["base", "notifications", "users"],
    queryFn: () =>
      userApi.page({
        status: 1,
        limit: 100,
        offset: 0,
      }),
  })

  const sendMutation = useMutation({
    mutationFn: (values: Parameters<typeof buildSendNotificationParam>[0]) =>
      notificationAdminApi.send(buildSendNotificationParam(values)),
    onSuccess: async () => {
      toast.success(t("notifications.toast.sent"))
      setSendOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["base", "notifications", "dispatches"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "unread-count"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "page"],
        }),
      ])
    },
  })

  const createTemplateMutation = useMutation({
    mutationFn: (values: NotificationTemplateFormValues) =>
      notificationAdminApi.createTemplate(buildCreateTemplateParam(values)),
    onSuccess: async () => {
      toast.success(t("notifications.toast.templateCreated"))
      setTemplateDialog(DEFAULT_TEMPLATE_DIALOG)
      await queryClient.invalidateQueries({
        queryKey: ["base", "notifications", "templates"],
      })
    },
  })

  const updateTemplateMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: NotificationTemplateFormValues
    }) =>
      notificationAdminApi.updateTemplate(buildUpdateTemplateParam(id, values)),
    onSuccess: async () => {
      toast.success(t("notifications.toast.templateUpdated"))
      setTemplateDialog(DEFAULT_TEMPLATE_DIALOG)
      await queryClient.invalidateQueries({
        queryKey: ["base", "notifications", "templates"],
      })
    },
  })

  const createRuleMutation = useMutation({
    mutationFn: (values: NotificationRuleFormValues) =>
      notificationAdminApi.createRule(buildCreateRuleParam(values)),
    onSuccess: async () => {
      toast.success(t("notifications.toast.ruleCreated"))
      setRuleDialog(DEFAULT_RULE_DIALOG)
      await queryClient.invalidateQueries({
        queryKey: ["base", "notifications", "rules"],
      })
    },
  })

  const updateRuleMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: NotificationRuleFormValues
    }) => notificationAdminApi.updateRule(buildUpdateRuleParam(id, values)),
    onSuccess: async () => {
      toast.success(t("notifications.toast.ruleUpdated"))
      setRuleDialog(DEFAULT_RULE_DIALOG)
      await queryClient.invalidateQueries({
        queryKey: ["base", "notifications", "rules"],
      })
    },
  })

  const userOptions = useMemo(
    () =>
      (usersQuery.data?.items ?? []).map((user: UserData) => ({
        id: user.id,
        label: user.nickname
          ? `${user.nickname} · ${user.username}`
          : user.username,
      })),
    [usersQuery.data?.items]
  )

  const templateOptions = useMemo(
    () =>
      (templatesQuery.data?.items ?? []).map((template) => ({
        id: template.id,
        label: `${template.name} · ${template.code}`,
        title_template: template.title_template,
        body_template: template.body_template,
        action_url_template: template.action_url_template ?? "",
      })),
    [templatesQuery.data?.items]
  )

  const isRefreshing =
    dispatchesQuery.isFetching ||
    templatesQuery.isFetching ||
    rulesQuery.isFetching ||
    usersQuery.isFetching

  return {
    view: {
      locale,
      activePanel,
      panelOptions: PANEL_OPTIONS,
      dispatchCount: dispatchesQuery.data?.total ?? 0,
      templateCount: templatesQuery.data?.total ?? 0,
      ruleCount: rulesQuery.data?.total ?? 0,
      dispatches: dispatchesQuery.data?.items ?? [],
      templates: templatesQuery.data?.items ?? [],
      rules: rulesQuery.data?.items ?? [],
      isRefreshing,
      onPanelChange: handlePanelChange,
      onRefresh: () => {
        void Promise.all([
          dispatchesQuery.refetch(),
          templatesQuery.refetch(),
          rulesQuery.refetch(),
          usersQuery.refetch(),
        ])
      },
      onOpenSend: () => setSendOpen(true),
      onOpenCreateTemplate: () =>
        setTemplateDialog({
          open: true,
          mode: "create",
          item: null,
        }),
      onOpenEditTemplate: (item: NotificationTemplateData) =>
        setTemplateDialog({
          open: true,
          mode: "update",
          item,
        }),
      onOpenCreateRule: () =>
        setRuleDialog({
          open: true,
          mode: "create",
          item: null,
        }),
      onOpenEditRule: (item: NotificationRuleData) =>
        setRuleDialog({
          open: true,
          mode: "update",
          item,
        }),
    },
    sendDialog: {
      open: sendOpen,
      userOptions,
      templateOptions,
      isBusy: sendMutation.isPending,
      onOpenChange: setSendOpen,
      onSubmit: (values: Parameters<typeof buildSendNotificationParam>[0]) =>
        sendMutation.mutateAsync(values),
    },
    templateDialog: {
      ...templateDialog,
      isBusy:
        createTemplateMutation.isPending || updateTemplateMutation.isPending,
      onOpenChange: (open: boolean) => {
        if (!open) {
          setTemplateDialog(DEFAULT_TEMPLATE_DIALOG)
          return
        }
        setTemplateDialog((current) => ({ ...current, open }))
      },
      onSubmit: (values: NotificationTemplateFormValues) => {
        if (templateDialog.mode === "update" && templateDialog.item) {
          return updateTemplateMutation.mutateAsync({
            id: templateDialog.item.id,
            values,
          })
        }

        return createTemplateMutation.mutateAsync(values)
      },
    },
    ruleDialog: {
      ...ruleDialog,
      userOptions,
      templateOptions,
      isBusy: createRuleMutation.isPending || updateRuleMutation.isPending,
      onOpenChange: (open: boolean) => {
        if (!open) {
          setRuleDialog(DEFAULT_RULE_DIALOG)
          return
        }
        setRuleDialog((current) => ({ ...current, open }))
      },
      onOpenCreateTemplate: () => {
        setRuleDialog(DEFAULT_RULE_DIALOG)
        handlePanelChange("templates")
        setTemplateDialog({
          open: true,
          mode: "create",
          item: null,
        })
      },
      onSubmit: (values: NotificationRuleFormValues) => {
        if (ruleDialog.mode === "update" && ruleDialog.item) {
          return updateRuleMutation.mutateAsync({
            id: ruleDialog.item.id,
            values,
          })
        }

        return createRuleMutation.mutateAsync(values)
      },
    },
  }
}
