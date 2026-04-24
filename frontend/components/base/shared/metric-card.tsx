import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  tone?: "default" | "success" | "warning"
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
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 p-4 shadow-sm backdrop-blur",
        toneClassNames[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>

        {icon ? (
          <div className="bg-background/80 text-muted-foreground flex size-10 items-center justify-center rounded-2xl border border-border/60">
            {icon}
          </div>
        ) : null}
      </div>

      {hint ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
