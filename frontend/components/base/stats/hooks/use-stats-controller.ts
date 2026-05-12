"use client"

import { parseAsInteger, useQueryState } from "nuqs"

export function useStatsController() {
  const [days] = useQueryState("days", parseAsInteger.withDefault(30))
  return { days }
}
