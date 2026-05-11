"use client"

import { ManagementPageHeader } from "@/components/base/shared/management-page-header"
import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { Badge } from "@/components/reui/badge"
import { LabelTooltip } from "@/components/topui/tooltip"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useI18n } from "@/providers/i18n-provider"
import type {
  NotificationDispatchData,
  NotificationRuleData,
  NotificationTemplateData,
} from "@/types/base.types"
import {
  BellRingIcon,
  FileTextIcon,
  PlusIcon,
  RefreshCwIcon,
  SendHorizonalIcon,
  WorkflowIcon,
} from "lucide-react"

import {
  buildNotificationSummary,
  formatDateTime,
  formatNotificationDisplayText,
  formatNotificationLocaleLabel,
  formatRecipientSelectorLabel,
  formatRuleScheduleSummary,
  formatRuleTriggerModeLabel,
  formatTriggerTypeLabel,
  type NotificationsPanel,
} from "./helpers"

interface NotificationsPageContainerProps {
  locale: string
  activePanel: NotificationsPanel
  panelOptions: Array<{
    value: NotificationsPanel
    countKey: "dispatchCount" | "templateCount" | "ruleCount"
  }>
  dispatchCount: number
  templateCount: number
  ruleCount: number
  dispatches: NotificationDispatchData[]
  templates: NotificationTemplateData[]
  rules: NotificationRuleData[]
  isRefreshing: boolean
  onPanelChange: (panel: NotificationsPanel) => void
  onRefresh: () => void
  onOpenSend: () => void
  onOpenCreateTemplate: () => void
  onOpenEditTemplate: (item: NotificationTemplateData) => void
  onOpenCreateRule: () => void
  onOpenEditRule: (item: NotificationRuleData) => void
}

const PANEL_ICONS = {
  dispatches: BellRingIcon,
  templates: FileTextIcon,
  rules: WorkflowIcon,
} as const

export function NotificationsPageContainer({
  locale,
  activePanel,
  panelOptions,
  dispatchCount,
  templateCount,
  ruleCount,
  dispatches,
  templates,
  rules,
  isRefreshing,
  onPanelChange,
  onRefresh,
  onOpenSend,
  onOpenCreateTemplate,
  onOpenEditTemplate,
  onOpenCreateRule,
  onOpenEditRule,
}: NotificationsPageContainerProps) {
  const { t } = useI18n()
  const countMap = {
    dispatchCount,
    templateCount,
    ruleCount,
  }

  const primaryAction =
    activePanel === "dispatches"
      ? {
          icon: SendHorizonalIcon,
          label: t("notifications.actions.send"),
          onClick: onOpenSend,
        }
      : activePanel === "templates"
        ? {
            icon: PlusIcon,
            label: t("notifications.actions.newTemplate"),
            onClick: onOpenCreateTemplate,
          }
        : {
            icon: PlusIcon,
            label: t("notifications.actions.newRule"),
            onClick: onOpenCreateRule,
          }

  return (
    <Tabs
      value={activePanel}
      onValueChange={(value) =>
        value ? onPanelChange(value as NotificationsPanel) : undefined
      }
      className="w-full gap-5"
    >
      <ManagementPageHeader
        eyebrow={t("notifications.page.eyebrow")}
        title={t("notifications.page.title")}
        description={t("notifications.page.description")}
        className="rounded-none border-0 bg-transparent shadow-none"
        actions={
          <>
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCwIcon className="size-4" />
              {t("common.actions.refresh")}
            </Button>
            <Button onClick={primaryAction.onClick}>
              <primaryAction.icon className="size-4" />
              {primaryAction.label}
            </Button>
          </>
        }
      >
          <TabsList
            variant="line"
            className="h-auto w-full flex-wrap justify-start gap-2 p-0"
          >
            {panelOptions.map((item) => {
              const Icon = PANEL_ICONS[item.value]

              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="h-9 rounded-lg border border-border/70 px-3 data-active:border-primary/25 data-active:bg-primary/6"
                >
                  <Icon className="size-4" />
                  <span>{t(`notifications.panels.${item.value}`)}</span>
                  <Badge
                    variant={
                      activePanel === item.value ? "primary-light" : "outline"
                    }
                    size="sm"
                    radius="full"
                  >
                    {countMap[item.countKey]}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>
      </ManagementPageHeader>
      <TabsContent value="dispatches" className="mt-0 space-y-3">
          <div className="flex items-center gap-2">
            <LabelTooltip
              label={t("notifications.dispatches.title")}
              content={t("notifications.dispatches.description")}
              align="start"
              className="gap-2"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
            {dispatches.length === 0 ? (
              <EntityEmptyState
                compact
                title={t("notifications.empty.dispatchesTitle")}
                description={t("notifications.empty.dispatchesDescription")}
                action={
                  <Button size="sm" onClick={onOpenSend}>
                    <SendHorizonalIcon className="size-4" />
                    {t("notifications.actions.send")}
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("notifications.table.summary")}</TableHead>
                    <TableHead>{t("notifications.table.trigger")}</TableHead>
                    <TableHead>{t("notifications.table.recipient")}</TableHead>
                    <TableHead>{t("notifications.table.createdAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-[320px] whitespace-normal">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {buildNotificationSummary(item)}
                          </p>
                          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {item.body}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {formatTriggerTypeLabel(t, item.trigger_type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("notifications.table.recipientCount")}:{" "}
                            {item.recipient_count}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatRecipientSelectorLabel(
                          t,
                          item.recipient_selector_type
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(item.created_at, locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
      </TabsContent>

      <TabsContent value="templates" className="mt-0 space-y-3">
          <div className="flex items-center gap-2">
            <LabelTooltip
              label={t("notifications.templates.title")}
              content={t("notifications.templates.description")}
              align="start"
              className="gap-2"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
            {templates.length === 0 ? (
              <EntityEmptyState
                compact
                title={t("notifications.empty.templatesTitle")}
                description={t("notifications.empty.templatesDescription")}
                action={
                  <Button size="sm" onClick={onOpenCreateTemplate}>
                    <PlusIcon className="size-4" />
                    {t("notifications.actions.newTemplate")}
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("notifications.table.name")}</TableHead>
                    <TableHead>{t("notifications.table.eventCode")}</TableHead>
                    <TableHead>{t("notifications.table.locale")}</TableHead>
                    <TableHead>{t("notifications.table.status")}</TableHead>
                    <TableHead>{t("notifications.table.updatedAt")}</TableHead>
                    <TableHead>{t("notifications.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-[220px] whitespace-normal">
                        <div className="space-y-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatNotificationDisplayText(t, item.event_code)}
                      </TableCell>
                      <TableCell>
                        {formatNotificationLocaleLabel(t, item.locale)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 1 ? "success-light" : "warning-light"
                          }
                          radius="full"
                        >
                          {item.status === 1
                            ? t("notifications.status.enabled")
                            : t("notifications.status.disabled")}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(item.updated_at, locale)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenEditTemplate(item)}
                        >
                          {t("common.actions.edit")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
      </TabsContent>

      <TabsContent value="rules" className="mt-0 space-y-3">
          <div className="flex items-center gap-2">
            <LabelTooltip
              label={t("notifications.rules.title")}
              content={t("notifications.rules.description")}
              align="start"
              className="gap-2"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
            {rules.length === 0 ? (
              <EntityEmptyState
                compact
                title={t("notifications.empty.rulesTitle")}
                description={t("notifications.empty.rulesDescription")}
                action={
                  <Button size="sm" onClick={onOpenCreateRule}>
                    <PlusIcon className="size-4" />
                    {t("notifications.actions.newRule")}
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("notifications.table.name")}</TableHead>
                    <TableHead>{t("notifications.table.template")}</TableHead>
                    <TableHead>{t("notifications.table.trigger")}</TableHead>
                    <TableHead>{t("notifications.table.recipient")}</TableHead>
                    <TableHead>{t("notifications.table.nextRunAt")}</TableHead>
                    <TableHead>{t("notifications.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-[220px] whitespace-normal">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{item.name}</p>
                            <Badge
                              variant={
                                item.enabled ? "success-light" : "warning-light"
                              }
                              size="sm"
                              radius="full"
                            >
                              {item.enabled
                                ? t("notifications.status.enabled")
                                : t("notifications.status.disabled")}
                            </Badge>
                          </div>
                          {item.last_error?.trim() ? (
                            <p className="line-clamp-1 text-xs text-destructive">
                              {item.last_error}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[180px] whitespace-normal">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {formatNotificationDisplayText(t, item.template_name)}
                          </p>
                          {item.template_code?.trim() ? (
                            <p className="text-xs text-muted-foreground">
                              {item.template_code}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[220px] whitespace-normal">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {formatRuleTriggerModeLabel(t, item.trigger_mode)}
                          </p>
                          <p className="text-xs leading-5 text-muted-foreground">
                            {formatRuleScheduleSummary(t, item)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatRecipientSelectorLabel(
                          t,
                          item.recipient_selector_type
                        )}
                      </TableCell>
                      <TableCell>
                        {item.next_run_at
                          ? formatDateTime(item.next_run_at, locale)
                          : t("common.misc.none")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenEditRule(item)}
                        >
                          {t("common.actions.edit")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
      </TabsContent>
    </Tabs>
  )
}
