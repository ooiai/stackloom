"use client"

import { DetailMetaItem } from "@/components/base/shared/detail-meta-item"
import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import type { DictTreeNode } from "@/components/base/dicts/helpers"
import { DictStatusBadge } from "@/components/base/dicts/dict-status-badge"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import type { DictData } from "@/types/base.types"
import type { Table } from "@tanstack/react-table"
import {
  ChevronRightIcon,
  Edit3Icon,
  FolderOpenIcon,
  HomeIcon,
  PlusIcon,
  TagIcon,
} from "lucide-react"

interface DictsDetailPanelProps {
  selectedNode: DictTreeNode | null
  breadcrumb: DictTreeNode[]
  childItems: DictData[]
  table: Table<DictData>
  isFetching: boolean
  onSelectNode: (id: string | null) => void
  onOpenEdit: (dict: DictData) => void
  onOpenAddChild: (parentId: string) => void
}

export function DictsDetailPanel({
  selectedNode,
  breadcrumb,
  childItems,
  table,
  isFetching,
  onSelectNode,
  onOpenEdit,
  onOpenAddChild,
}: DictsDetailPanelProps) {
  const { t } = useI18n()

  if (!selectedNode) {
    return (
      <div className="flex min-h-140 items-center justify-center rounded-lg border border-dashed border-border/70 bg-background">
        <EntityEmptyState
          title={t("dicts.detail.emptyTitle")}
          description={t("dicts.detail.emptyDescription")}
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
              {item.label}
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
                  <TagIcon className="size-4 text-primary" />
                )}
                <h3 className="sm:text-md text-base font-semibold text-foreground">
                  {selectedNode.label}
                </h3>
              </div>
              <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {selectedNode.dict_key}
              </code>
              <DictStatusBadge status={selectedNode.status} />
            </div>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
              <DetailMetaItem
                label={t("dicts.detail.type")}
                value={selectedNode.dict_type}
              />
              <DetailMetaItem
                label={t("dicts.detail.value")}
                value={selectedNode.dict_value}
              />
              <DetailMetaItem
                label={t("dicts.detail.valueType")}
                value={selectedNode.value_type}
              />
              <DetailMetaItem
                label={t("dicts.detail.sort")}
                value={String(selectedNode.sort)}
              />
            </div>
            <p className="max-w-3xl text-[13px] leading-6 text-muted-foreground">
              {selectedNode.description || t("dicts.detail.noDescription")}
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
        loadingMessage={t("common.loading.syncingDicts")}
        emptyMessage={
          <EntityEmptyState
            title={t("dicts.detail.emptyChildrenTitle")}
            description={t("dicts.detail.emptyChildrenDescription")}
          />
        }
        tableLayout={{
          columnsMovable: false,
        }}
      >
        <div className="w-full space-y-2.5">
          <div className="px-1">
            <h4 className="text-sm font-semibold text-foreground">
              {t("dicts.detail.directChildrenTitle")}
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
