import { post } from "@/lib/http/axios"
import type { MonitorMetrics } from "@/types/monitor.types"

export const monitorApi = {
  getMetrics: async (): Promise<MonitorMetrics> => post("/apiv1/sys/monitor/metrics", {}),
}
