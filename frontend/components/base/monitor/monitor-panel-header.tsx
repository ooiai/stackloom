"use client"

import type { ReactNode } from "react"

interface MonitorPanelHeaderProps {
  title: string
  description?: string
  summary?: ReactNode
}

export function MonitorPanelHeader({
  title,
  description,
  summary,
}: MonitorPanelHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {summary ? (
        <div className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground">
          {summary}
        </div>
      ) : null}
    </div>
  )
}
