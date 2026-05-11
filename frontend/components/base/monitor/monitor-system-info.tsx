"use client"

import { MonitorIcon, ServerIcon } from "lucide-react"

import { useI18n } from "@/providers/i18n-provider"
import type { SystemSnapshot } from "@/types/monitor.types"

interface MonitorSystemInfoProps {
  snapshot: SystemSnapshot
}

export function MonitorSystemInfo({ snapshot }: MonitorSystemInfoProps) {
  const { t } = useI18n()

  const osLabel = [snapshot.os_name, snapshot.os_version].filter(Boolean).join(" ")
  const kernelLabel = snapshot.kernel_version

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <ServerIcon className="size-3.5 shrink-0" />
        <span className="font-medium text-foreground/80">
          {t("monitor.sysinfo_hostname")}
        </span>
        <span>{snapshot.hostname || "-"}</span>
      </span>

      {osLabel && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MonitorIcon className="size-3.5 shrink-0" />
          <span className="font-medium text-foreground/80">
            {t("monitor.sysinfo_os")}
          </span>
          <span>{osLabel}</span>
        </span>
      )}

      {kernelLabel && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {t("monitor.sysinfo_kernel")}
          </span>
          <span className="font-mono text-xs">{kernelLabel}</span>
        </span>
      )}
    </div>
  )
}
