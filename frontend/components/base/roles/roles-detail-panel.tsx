"use client"

import { DetailMetaItem } from "@/components/base/shared/detail-meta-item"
import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { RoleStatusBadge } from "@/components/base/roles/role-status-badge"
import type { RoleTreeNode } from "@/components/base/roles/helpers"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import type { RoleData } from "@/types/base.types"
import type { Table } from "@tanstack/react-table"
import {
  ChevronRightIcon,
  Edit3Icon,
  FolderOpenIcon,
  HomeIcon,
  PlusIcon,
  ShieldIcon,
} from "lucide-react"

interface RolesDetailPanelProps {
  permissions: {
    canAddChild: boolean
    canEdit: boolean
  }
  selectedNode: RoleTreeNode | null
  breadcrumb: RoleTreeNode[]
  childItems: RoleData[]
  table: Table<RoleData>
  isFetching: boolean
  onSelectNode: (id: string | null) => void
  onOpenEdit: (role: RoleData) => void
  onOpenAddChild: (parentId: string) => void
}

export function RolesDetailPanel({
  permissions,
  selectedNode,
  breadcrumb,
  childItems,
  table,
  isFetching,
  onSelectNode,
  onOpenEdit,
  onOpenAddChild,
}: RolesDetailPanelProps) {
  const { t } = useI18n()

  if (!selectedNode) {
    return (
      <div className="flex min-h-140 items-center justify-center rounded-lg border border-dashed border-border/70 bg-background">
        <EntityEmptyState
          title={t("roles.detail.emptyTitle")}
          description={t("roles.detail.emptyDescription")}
        />
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto rounded-md px-1.5 py-1 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => onSelectNode(null)}
        >
          <HomeIcon className="size-3.5" />
          {t("common.misc.rootDirectory")}
        </Button>
        {breadcrumb.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1">
            <ChevronRightIcon className="size-3.5 text-muted-foreground/60" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto rounded-md px-1.5 py-1 text-sm transition hover:text-foreground",
                index === breadcrumb.length - 1 && "font-medium text-foreground"
              )}
              onClick={() => onSelectNode(item.id)}
            >
              {item.name}
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-background px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                {selectedNode.children.length > 0 ? (
                  <FolderOpenIcon className="size-5 text-primary" />
                ) : (
                  <ShieldIcon className="size-4 text-primary" />
                )}
                <h3 className="text-base font-semibold text-foreground">
                  {selectedNode.name}
                </h3>
              </div>
              <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {selectedNode.code}
              </code>
              <RoleStatusBadge status={selectedNode.status} />
            </div>

            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
              <DetailMetaItem
                label={t("roles.detail.code")}
                value={selectedNode.code}
              />
              <DetailMetaItem
                label={t("roles.detail.description")}
                value={selectedNode.description || t("common.misc.none")}
              />
              <DetailMetaItem
                label={t("roles.detail.builtin")}
                value={
                  selectedNode.is_builtin
                    ? t("roles.detail.builtinOn")
                    : t("roles.detail.builtinOff")
                }
              />
              <DetailMetaItem
                label={t("roles.detail.sort")}
                value={String(selectedNode.sort)}
              />
            </div>
          </div>

          {permissions.canEdit || permissions.canAddChild ? (
            <div className="flex items-center gap-2">
              {permissions.canEdit ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenEdit(selectedNode)}
                >
                  <Edit3Icon />
                  {t("common.actions.edit")}
                </Button>
              ) : null}
              {permissions.canAddChild ? (
                <Button size="sm" onClick={() => onOpenAddChild(selectedNode.id)}>
                  <PlusIcon />
                  {t("common.actions.addChild")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <DataGrid
        table={table}
        recordCount={childItems.length}
        isLoading={isFetching}
        loadingMode="spinner"
        loadingMessage={t("common.loading.default")}
        emptyMessage={
          <EntityEmptyState
            title={t("roles.detail.emptyChildrenTitle")}
            description={t("roles.detail.emptyChildrenDescription")}
          />
        }
        tableLayout={{ columnsMovable: false }}
      >
        <div className="w-full space-y-2.5">
          <div className="px-1">
            <h4 className="text-sm font-semibold text-foreground">
              {t("roles.detail.directChildrenTitle")}
            </h4>
          </div>
          <DataGridContainer className="[&_svg.animate-spin]:text-primary">
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
        </div>
      </DataGrid>
    </section>
  )
}
