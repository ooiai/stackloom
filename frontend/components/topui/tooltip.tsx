"use client"

import { LucideCircleQuestionMark } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type TooltipsProps = {
  children?: React.ReactNode
  content?: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
}

type LabelTooltipProps = {
  label: React.ReactNode
  content: React.ReactNode
  className?: string
  iconClassName?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function Tooltips({
  children,
  content,
  side = "top",
  align = "center",
  className,
}: TooltipsProps) {
  return (
    <Tooltip>
      <TooltipTrigger className={cn("inline-flex", className)}>
        {children ? children : <Button>Tooltip</Button>}
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {content ?? "This is tooltip content"}
      </TooltipContent>
    </Tooltip>
  )
}

export function LabelTooltip({
  label,
  content,
  className,
  iconClassName,
  side = "top",
  align = "center",
}: LabelTooltipProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span>{label}</span>
      <Tooltips content={content} side={side} align={align}>
        <span className="inline-flex size-4 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground">
          <LucideCircleQuestionMark className={cn("size-3", iconClassName)} />
        </span>
      </Tooltips>
    </span>
  )
}
