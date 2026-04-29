"use client"

import { DetailMetaItem } from "@/components/base/shared/detail-meta-item"
import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { TenantStatusBadge } from "@/components/base/tenants/tenant-status-badge"
import type { TenantTreeNode } from "@/components/base/tenants/helpers"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import type { TenantData } from "@/types/base.types"
import type { Table } from "@tanstack/react-table"
import {
  Building2Icon,
  ChevronRightIcon,
  Edit3Icon,
  FolderOpenIcon,
  HomeIcon,
  PlusIcon,
} from "lucide-react"

interface TenantsDetailPanelProps {
  selectedNode: TenantTreeNode | null
  breadcrumb: TenantTreeNode[]
  childItems: TenantData[]
  table: Table<TenantData>
  isFetching: boolean
  onSelectNode: (id: string | null) => void
  onOpenEdit: (tenant: TenantData) => void
  onOpenAddChild: (parentId: string) => void
}

export function TenantsDetailPanel({
  selectedNode,
  breadcrumb,
  childItems,
  table,
  isFetching,
  onSelectNode,
  onOpenEdit,
  onOpenAddChild,
}: TenantsDetailPanelProps) {
  const { t } = useI18n()

  if (!selectedNode) {
    return (
      <div className="flex min-h-140 items-center justify-center rounded-lg border border-dashed border-border/70 bg-background">
        <EntityEmptyState
          title={t("tenants.detail.emptyTitle")}
          description={t("tenants.detail.emptyDescription")}
        />
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onSelectNode(null)}
        >
          <HomeIcon className="size-3.5" />
          {t("common.misc.rootDirectory")}
        </Button>
        {breadcrumb.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1">
            <ChevronRightIcon className="size-3 text-muted-foreground/60" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto rounded-md px-1.5 py-1 text-xs transition hover:text-foreground",
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
                  <Building2Icon className="size-4 text-primary" />
                )}
                <h3 className="text-base font-semibold text-foreground">
                  {selectedNode.name}
                </h3>
              </div>
              <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {selectedNode.slug}
              </code>
              <TenantStatusBadge status={selectedNode.status} />
            </div>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
              <DetailMetaItem
                label={t("tenants.detail.slug")}
                value={selectedNode.slug}
              />
              <DetailMetaItem
                label={t("tenants.detail.planCode")}
                value={selectedNode.plan_code || t("common.misc.none")}
              />
              <DetailMetaItem
                label={t("tenants.detail.owner")}
                value={selectedNode.owner_user_id || t("common.misc.none")}
              />
              <DetailMetaItem
                label={t("tenants.detail.expiredAt")}
                value={selectedNode.expired_at || t("common.misc.none")}
              />
            </div>
            <p className="max-w-3xl text-[13px] leading-6 text-muted-foreground">
              {selectedNode.description || t("tenants.detail.noDescription")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenEdit(selectedNode)}
            >
              <Edit3Icon />
              {t("common.actions.edit")}
            </Button>
            <Button size="sm" onClick={() => onOpenAddChild(selectedNode.id)}>
              <PlusIcon />
              {t("common.actions.addChild")}
            </Button>
          </div>
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
            title={t("tenants.detail.emptyChildrenTitle")}
            description={t("tenants.detail.emptyChildrenDescription")}
          />
        }
        tableLayout={{ columnsMovable: false }}
      >
        <div className="w-full space-y-2.5">
          <div className="px-1">
            <h4 className="text-sm font-semibold text-foreground">
              {t("tenants.detail.directChildrenTitle")}
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
