"use client"

import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

interface SectionHeaderProps {
  title: string
  description: string
  className?: string
}

function SectionHeader({
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="space-y-1">
        <h3 className="text-sm leading-none font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-[12px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

export function DictMutateBasicSection({
  children,
}: {
  children: ReactNode
}) {
  return (
    <section className="space-y-5">
      <SectionHeader
        title="基础信息"
        description="定义字典项的展示名称、键值和归属类型。"
      />
      <div className="grid gap-x-4 gap-y-5 md:grid-cols-1">{children}</div>
    </section>
  )
}

export function DictMutateSupplementSection({
  children,
}: {
  children: ReactNode
}) {
  return (
    <section className="space-y-5">
      <SectionHeader
        title="说明与扩展"
        description="补充业务含义、适用范围和扩展 JSON 配置。"
      />
      <div className="space-y-5">{children}</div>
    </section>
  )
}

export function DictMutateSheetFooter({
  isBusy,
  submitLabel,
  onCancel,
}: {
  isBusy: boolean
  submitLabel: string
  onCancel: () => void
}) {
  return (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full rounded-lg text-[13px] sm:w-auto"
        onClick={onCancel}
        disabled={isBusy}
      >
        取消
      </Button>
      <Button
        type="submit"
        className="h-9 w-full gap-2 rounded-lg text-[13px] sm:w-auto"
        disabled={isBusy}
      >
        {isBusy ? <Loader2Icon className="size-3.5 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </div>
  )
}
