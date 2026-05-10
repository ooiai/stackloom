"use client"

import { RefreshCwIcon } from "lucide-react"

import { ManagementPageHeader } from "@/components/base/shared/management-page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useI18n } from "@/providers/i18n-provider"
import type { MonitorMetrics } from "@/types/monitor.types"
import { MonitorAppStatsGrid } from "./monitor-app-stats-grid"
import { MonitorBusinessSummary } from "./monitor-business-summary"
import { MonitorCpuCoresGrid } from "./monitor-cpu-cores-grid"
import { MonitorDatabaseGrid } from "./monitor-database-grid"
import { MonitorDatabaseTopQueries } from "./monitor-database-top-queries"
import { MonitorLatencyChart } from "./monitor-latency-chart"
import { MonitorNetworkGrid } from "./monitor-network-grid"
import { MonitorOverviewStrip } from "./monitor-overview-strip"
import { MonitorProcessGrid } from "./monitor-process-grid"
import { MonitorRedisGrid } from "./monitor-redis-grid"
import { MonitorRequestChart } from "./monitor-request-chart"
import { MonitorSectionGroup } from "./monitor-section-group"
import { MonitorSnapshotGrid } from "./monitor-snapshot-grid"
import { MonitorStatusChart } from "./monitor-status-chart"
import { MonitorTopEndpoints } from "./monitor-top-endpoints"

interface MonitorPageContainerProps {
  metrics: MonitorMetrics
  isFetching: boolean
  onRefresh: () => void
}

export function MonitorPageContainer({
  metrics,
  isFetching,
  onRefresh,
}: MonitorPageContainerProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-8 p-6">
      <ManagementPageHeader
        title={t("monitor.title")}
        description={t("monitor.description")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
          >
            {isFetching ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCwIcon className="size-4" />
            )}
            {t("monitor.refresh")}
          </Button>
        }
      />

      <MonitorOverviewStrip metrics={metrics} />

      <MonitorSectionGroup
        title={t("monitor.group_charts")}
        description={t("monitor.group_charts_description")}
        summary={t("monitor.last_24_hours")}
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div className="xl:col-span-3">
            <MonitorRequestChart hourlyStats={metrics.hourly_stats} />
          </div>
          <MonitorLatencyChart hourlyStats={metrics.hourly_stats} />
        </div>
        <MonitorStatusChart statusDistribution={metrics.status_distribution} />
      </MonitorSectionGroup>

      {/* Group 1: System Resources */}
      <MonitorSectionGroup
        title={t("monitor.group_system")}
        description={t("monitor.group_system_description")}
      >
        <MonitorSnapshotGrid snapshot={metrics.snapshot} />
        <MonitorCpuCoresGrid snapshot={metrics.snapshot} />
        <MonitorNetworkGrid snapshot={metrics.snapshot} />
      </MonitorSectionGroup>

      {/* Group 2: App Runtime */}
      <MonitorSectionGroup
        title={t("monitor.group_runtime")}
        description={t("monitor.group_runtime_description")}
      >
        <MonitorProcessGrid snapshot={metrics.snapshot} />
      </MonitorSectionGroup>

      {/* Group 3: Database */}
      <MonitorSectionGroup
        title={t("monitor.group_database")}
        description={t("monitor.group_database_description")}
      >
        <MonitorDatabaseGrid databaseStats={metrics.database_stats} />
        <MonitorDatabaseTopQueries databaseStats={metrics.database_stats} />
      </MonitorSectionGroup>

      {/* Group 4: Redis */}
      <MonitorSectionGroup
        title={t("monitor.group_redis")}
        description={t("monitor.group_redis_description")}
      >
        <MonitorRedisGrid redisStats={metrics.redis_stats} />
      </MonitorSectionGroup>

      {/* Group 5: App Performance */}
      <MonitorSectionGroup
        title={t("monitor.group_performance")}
        description={t("monitor.group_performance_description")}
      >
        <MonitorAppStatsGrid appStats={metrics.app_stats} />
      </MonitorSectionGroup>

      {/* Group 6: Business Overview */}
      <MonitorSectionGroup
        title={t("monitor.group_business")}
        description={t("monitor.group_business_description")}
      >
        <MonitorBusinessSummary businessSummary={metrics.business_summary} />
      </MonitorSectionGroup>

      {/* Group 8: Endpoint Analysis */}
      <MonitorSectionGroup
        title={t("monitor.group_endpoints")}
        description={t("monitor.group_endpoints_description")}
      >
        <MonitorTopEndpoints
          topSlow={metrics.top_slow_endpoints}
          topError={metrics.top_error_endpoints}
        />
      </MonitorSectionGroup>
    </div>
  )
}
