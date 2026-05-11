"use client"

import { ManagementPageHeader } from "@/components/base/shared/management-page-header"
import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { LabelTooltip } from "@/components/topui/tooltip"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { PlusIcon, RefreshCwIcon } from "lucide-react"

import {
  buildNotificationSummary,
  formatDateTime,
  formatNotificationDisplayText,
  formatNotificationLocaleLabel,
  formatRecipientSelectorLabel,
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

  return (
    <div className="w-full space-y-5">
      <ManagementPageHeader
        eyebrow={t("notifications.page.eyebrow")}
        title={t("notifications.page.title")}
        description={t("notifications.page.description")}
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
            <Button onClick={onOpenSend}>
              <PlusIcon className="size-4" />
              {t("notifications.actions.send")}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {panelOptions.map((item) => (
            <Button
              key={item.value}
              variant={activePanel === item.value ? "default" : "outline"}
              size="sm"
              onClick={() => onPanelChange(item.value)}
            >
              {t(`notifications.panels.${item.value}`)}
              <span className="ms-1 rounded-full bg-background/70 px-1.5 text-xs text-muted-foreground">
                {countMap[item.countKey]}
              </span>
            </Button>
          ))}
        </div>
      </ManagementPageHeader>

      {activePanel === "dispatches" ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <LabelTooltip
                label={t("notifications.dispatches.title")}
                content={t("notifications.dispatches.description")}
                align="start"
                className="gap-2"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dispatches.length === 0 ? (
              <EntityEmptyState
                title={t("notifications.empty.dispatchesTitle")}
                description={t("notifications.empty.dispatchesDescription")}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("notifications.table.summary")}</TableHead>
                    <TableHead>{t("notifications.table.trigger")}</TableHead>
                    <TableHead>{t("notifications.table.recipient")}</TableHead>
                    <TableHead>
                      {t("notifications.table.recipientCount")}
                    </TableHead>
                    <TableHead>{t("notifications.table.createdAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {buildNotificationSummary(item)}
                          </p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {item.body}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatTriggerTypeLabel(t, item.trigger_type)}
                      </TableCell>
                      <TableCell>
                        {formatRecipientSelectorLabel(
                          t,
                          item.recipient_selector_type
                        )}
                      </TableCell>
                      <TableCell>{item.recipient_count}</TableCell>
                      <TableCell>
                        {formatDateTime(item.created_at, locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activePanel === "templates" ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <LabelTooltip
                  label={t("notifications.templates.title")}
                  content={t("notifications.templates.description")}
                  align="start"
                  className="gap-2"
                />
              </CardTitle>
            </div>
            <CardAction>
              <Button size="sm" onClick={onOpenCreateTemplate}>
                <PlusIcon className="size-4" />
                {t("notifications.actions.newTemplate")}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <EntityEmptyState
                title={t("notifications.empty.templatesTitle")}
                description={t("notifications.empty.templatesDescription")}
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
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatNotificationDisplayText(t, item.event_code)}
                      </TableCell>
                      <TableCell>
                        {formatNotificationLocaleLabel(t, item.locale)}
                      </TableCell>
                      <TableCell>
                        {item.status === 1
                          ? t("notifications.status.enabled")
                          : t("notifications.status.disabled")}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(item.updated_at, locale)}
                      </TableCell>
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
          </CardContent>
        </Card>
      ) : null}

      {activePanel === "rules" ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <LabelTooltip
                  label={t("notifications.rules.title")}
                  content={t("notifications.rules.description")}
                  align="start"
                  className="gap-2"
                />
              </CardTitle>
            </div>
            <CardAction>
              <Button size="sm" onClick={onOpenCreateRule}>
                <PlusIcon className="size-4" />
                {t("notifications.actions.newRule")}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <EntityEmptyState
                title={t("notifications.empty.rulesTitle")}
                description={t("notifications.empty.rulesDescription")}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("notifications.table.name")}</TableHead>
                    <TableHead>{t("notifications.table.template")}</TableHead>
                    <TableHead>{t("notifications.table.eventCode")}</TableHead>
                    <TableHead>{t("notifications.table.recipient")}</TableHead>
                    <TableHead>{t("notifications.table.status")}</TableHead>
                    <TableHead>{t("notifications.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1">
                          <p>{formatNotificationDisplayText(t, item.template_name)}</p>
                          {item.template_code?.trim() ? (
                            <p className="text-xs text-muted-foreground">
                              {item.template_code}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{item.event_code}</TableCell>
                      <TableCell>
                        {formatRecipientSelectorLabel(
                          t,
                          item.recipient_selector_type
                        )}
                      </TableCell>
                      <TableCell>
                        {item.enabled
                          ? t("notifications.status.enabled")
                          : t("notifications.status.disabled")}
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
