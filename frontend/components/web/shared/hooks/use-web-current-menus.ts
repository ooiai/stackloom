"use client"

import { useQuery } from "@tanstack/react-query"

import { headerSharedQueryOptions } from "@/hooks/use-header-context"
import { userSharedApi } from "@/stores/base-api"

export const WEB_CURRENT_MENUS_QUERY_KEY = ["webCurrentMenus"] as const

export function useWebCurrentMenus() {
  const query = useQuery({
    queryKey: [...WEB_CURRENT_MENUS_QUERY_KEY],
    queryFn: async () => {
      try {
        return await userSharedApi.listCurrentMenus("FRONTEND")
      } catch {
        return []
      }
    },
    ...headerSharedQueryOptions,
  })

  return {
    ...query,
    menus: query.data ?? [],
  }
}
