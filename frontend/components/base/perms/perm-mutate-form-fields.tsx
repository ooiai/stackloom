"use client"

import { useMemo, useState } from "react"

import {
  buildPermExpandedPathIds,
  type PermTreeNode,
  findPermNode,
  PERM_HTTP_METHOD_OPTIONS,
} from "@/components/base/perms/helpers"
import {
  PermMutateBasicSection,
  PermMutateDisplaySection,
  PermMutateRouteSection,
} from "@/components/base/perms/perm-mutate-sheet-sections"
import type { PermMutateFormApi } from "@/components/base/perms/hooks/use-perm-mutate-form"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/reui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import { ScrollArea } from "@/components/reui/scroll-area"
import type { PermData, PermHttpMethod } from "@/types/base.types"
import { Textarea } from "@/components/reui/textarea"
import { LabelField } from "@/components/topui/label-field"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  KeyRoundIcon,
  LayoutPanelTopIcon,
} from "lucide-react"

function ParentSummary({
  node,
  fallbackParent,
  rootLabel,
  loadingLabel,
}: {
  node: PermTreeNode | null
  fallbackParent: PermData | null
  rootLabel: string
  loadingLabel: string
}) {
  if (!node && !fallbackParent) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <LayoutPanelTopIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{rootLabel}</span>
      </div>
    )
  }

  const displayName = node?.name ?? fallbackParent?.name ?? loadingLabel
  const displayCode = node?.code ?? fallbackParent?.code ?? null
  const hasChildren = (node?.children.length ?? 0) > 0
  const Icon = hasChildren || (!node && fallbackParent) ? FolderIcon : KeyRoundIcon

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{displayName}</div>
        {displayCode ? (
          <div className="truncate text-xs text-muted-foreground">
            {displayCode}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ParentTreeNodeItem({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggleExpand,
  onSelect,
}: {
  node: PermTreeNode
  depth: number
  selectedId: string | null
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onSelect: (id: string) => void
}) {
  const isSelected = selectedId === node.id
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)

  return (
    <div>
      <div
        className={cn(
          "group flex items-center rounded-md pr-2 text-sm transition-colors",
          isSelected
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted/70"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            "size-5 shrink-0 rounded p-0 text-muted-foreground hover:bg-accent/50",
            !hasChildren && "invisible"
          )}
          onClick={(event) => {
            event.stopPropagation()
            onToggleExpand(node.id)
          }}
        >
          {isExpanded ? (
            <ChevronDownIcon className="size-3.5" />
          ) : (
            <ChevronRightIcon className="size-3.5" />
          )}
        </Button>

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
          onClick={() => onSelect(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <FolderOpenIcon
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
            ) : (
              <FolderIcon
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
            )
          ) : (
            <KeyRoundIcon
              className={cn(
                "size-3.5 shrink-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}
            />
          )}
          <div className="min-w-0">
            <div className="truncate font-medium">{node.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {node.code}
            </div>
          </div>
        </button>

        {isSelected ? <CheckIcon className="size-4 shrink-0" /> : null}
      </div>

      {hasChildren && isExpanded ? (
        <div>
          {node.children.map((child) => (
            <ParentTreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ParentPermissionPicker({
  value,
  parent,
  parentTree,
  isParentTreeLoading,
  onBlur,
  onChange,
}: {
  value: string | null | undefined
  parent: PermData | null
  parentTree: PermTreeNode[]
  isParentTreeLoading: boolean
  onBlur: () => void
  onChange: (value: string | null) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [manualExpandedIds, setManualExpandedIds] = useState<Set<string>>(
    new Set()
  )
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const rootLabel = t("perms.form.parent.root")
  const selectedParent = useMemo(
    () => (value ? findPermNode(parentTree, value) : null),
    [parentTree, value]
  )
  const autoExpandedIds = useMemo(
    () => buildPermExpandedPathIds(parentTree, value ?? null),
    [parentTree, value]
  )
  const expandedIds = useMemo(() => {
    const next = new Set(autoExpandedIds)
    for (const id of manualExpandedIds) {
      next.add(id)
    }
    for (const id of collapsedIds) {
      next.delete(id)
    }
    return next
  }, [autoExpandedIds, collapsedIds, manualExpandedIds])

  const toggleExpand = (id: string) => {
    if (expandedIds.has(id)) {
      setManualExpandedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      if (autoExpandedIds.has(id)) {
        setCollapsedIds((prev) => {
          const next = new Set(prev)
          next.add(id)
          return next
        })
      }
      return
    }

    setCollapsedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setManualExpandedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setManualExpandedIds(new Set())
          setCollapsedIds(new Set())
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 w-full justify-between px-3 py-2"
            onBlur={onBlur}
          />
        }
      >
        <ParentSummary
          node={selectedParent}
          fallbackParent={value ? parent : null}
          rootLabel={rootLabel}
          loadingLabel={t("common.loading.default")}
        />
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[min(28rem,calc(100vw-3rem))] p-0">
        <PopoverHeader className="border-b border-border/60 px-3 py-3">
          <PopoverTitle>{t("perms.form.parent.title")}</PopoverTitle>
          <p className="text-xs text-muted-foreground">
            {t("perms.form.parent.description")}
          </p>
        </PopoverHeader>

        <div className="p-2">
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              value == null
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted/70"
            )}
            onClick={() => {
              onChange(null)
              setOpen(false)
              onBlur()
            }}
          >
            <LayoutPanelTopIcon className="size-4 shrink-0" />
            <span className="truncate font-medium">{rootLabel}</span>
            {value == null ? <CheckIcon className="ml-auto size-4 shrink-0" /> : null}
          </button>
        </div>

        <ScrollArea className="h-72 border-t border-border/60">
          <div className="p-2">
            {isParentTreeLoading && parentTree.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                {t("common.loading.default")}
              </div>
            ) : parentTree.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                {t("perms.form.parent.empty")}
              </div>
            ) : (
              parentTree.map((node) => (
                <ParentTreeNodeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={value ?? null}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onSelect={(nextId) => {
                    onChange(nextId)
                    setOpen(false)
                    onBlur()
                  }}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export function PermMutateFormFields({
  form,
  parent,
  parentTree,
  isParentTreeLoading,
}: {
  form: PermMutateFormApi
  parent: PermData | null
  parentTree: PermTreeNode[]
  isParentTreeLoading: boolean
}) {
  const { t } = useI18n()
  const methodLabelMap: Record<PermHttpMethod | "", string> = {
    "": t("perms.form.method.none"),
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DELETE",
    HEAD: "HEAD",
    OPTIONS: "OPTIONS",
  }
  const statusLabelMap: Record<0 | 1, string> = {
    0: t("perms.status.disabled.label"),
    1: t("perms.status.active.label"),
  }

  return (
    <>
      <PermMutateBasicSection>
        <form.Field name="parent_id">
          {(field) => (
            <Field className="sm:col-span-2">
              <FieldLabel>{t("perms.form.parent.label")}</FieldLabel>
              <FieldContent>
                <ParentPermissionPicker
                  value={field.state.value}
                  parent={parent}
                  parentTree={parentTree}
                  isParentTreeLoading={isParentTreeLoading}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="name">
          {(field) => (
            <LabelField
              label={t("perms.form.name.label")}
              htmlFor={field.name}
              error={
                field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null
              }
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("perms.form.name.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="code">
          {(field) => (
            <LabelField
              label={t("perms.form.code.label")}
              htmlFor={field.name}
              error={
                field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null
              }
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("perms.form.code.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>
      </PermMutateBasicSection>

      <PermMutateRouteSection>
        <form.Field name="resource">
          {(field) => (
            <LabelField
              label={t("perms.form.resource.label")}
              htmlFor={field.name}
              error={
                field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null
              }
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("perms.form.resource.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="action">
          {(field) => (
            <LabelField
              label={t("perms.form.action.label")}
              htmlFor={field.name}
              error={
                field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null
              }
            >
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={t("perms.form.action.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="method">
          {(field) => (
            <Field>
              <FieldLabel>{t("perms.form.method.label")}</FieldLabel>
              <FieldContent>
                <Select
                  value={field.state.value || "__none__"}
                  onValueChange={(value) =>
                    field.handleChange(
                      value === "__none__" ? "" : (value as PermHttpMethod)
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {methodLabelMap[field.state.value || ""]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {t("perms.form.method.none")}
                    </SelectItem>
                    {PERM_HTTP_METHOD_OPTIONS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <LabelField
              label={t("perms.form.description.label")}
              htmlFor={field.name}
              error={
                field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null
              }
            >
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={4}
                placeholder={t("perms.form.description.placeholder")}
              />
            </LabelField>
          )}
        </form.Field>
      </PermMutateRouteSection>

      <PermMutateDisplaySection>
        <form.Field name="sort">
          {(field) => (
            <LabelField label={t("perms.form.sort.label")} htmlFor={field.name}>
              <Input
                id={field.name}
                type="number"
                min={0}
                max={9999}
                value={String(field.state.value)}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(Number(event.target.value || "0"))
                }
              />
            </LabelField>
          )}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <Field>
              <FieldLabel>{t("perms.form.status.label")}</FieldLabel>
              <FieldContent>
                <Select
                  value={String(field.state.value)}
                  onValueChange={(value) =>
                    field.handleChange(Number(value) as 0 | 1)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {statusLabelMap[field.state.value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      {t("perms.status.active.label")}
                    </SelectItem>
                    <SelectItem value="0">
                      {t("perms.status.disabled.label")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>
      </PermMutateDisplaySection>
    </>
  )
}
