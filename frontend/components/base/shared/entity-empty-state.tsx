import type { ReactNode } from "react"

import { DatabaseSearchIcon } from "lucide-react"

interface EntityEmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  compact?: boolean
}

export function EntityEmptyState({
  title,
  description,
  action,
  compact = false,
}: EntityEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 text-center ${
        compact ? "py-8" : "py-12"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-xl border border-border/60 bg-muted/30 ${
          compact ? "size-10" : "size-12"
        }`}
      >
        <DatabaseSearchIcon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="max-w-sm text-[13px] leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
