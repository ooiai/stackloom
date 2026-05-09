import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  tone?: "default" | "success" | "warning"
  subValue?: string
  footer?: string
  className?: string
  valueClassName?: string
  size?: "default" | "hero"
}

const toneClassNames: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "bg-background/80",
  success: "bg-emerald-500/8",
  warning: "bg-amber-500/10",
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  subValue,
  footer,
  className,
  valueClassName,
  size = "default",
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 p-4 shadow-sm backdrop-blur transition-colors",
        toneClassNames[tone],
        size === "hero" && "p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-end gap-2">
            <p
              className={cn(
                "text-2xl font-semibold tracking-tight text-foreground",
                size === "hero" && "text-3xl md:text-4xl",
                valueClassName
              )}
            >
              {value}
            </p>
            {subValue ? (
              <span className="pb-1 text-xs font-medium text-muted-foreground">
                {subValue}
              </span>
            ) : null}
          </div>
        </div>

        {icon ? (
          <div className="bg-background/80 text-muted-foreground flex size-10 items-center justify-center rounded-2xl border border-border/60">
            {icon}
          </div>
        ) : null}
      </div>

      {hint || footer ? (
        <div className="mt-3 space-y-1.5">
          {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
          {footer ? <p className="text-xs font-medium text-foreground/80">{footer}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
