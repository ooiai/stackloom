"use client"

import { useQuery } from "@tanstack/react-query"

import {
  CURRENT_MENUS_QUERY_KEY,
  headerSharedQueryOptions,
} from "@/hooks/use-header-context"
import { userSharedApi } from "@/stores/base-api"

export function useCurrentMenus() {
  const query = useQuery({
    queryKey: [...CURRENT_MENUS_QUERY_KEY],
    queryFn: () => userSharedApi.listCurrentMenus(),
    ...headerSharedQueryOptions,
  })

  return {
    ...query,
    menus: query.data ?? [],
  }
}
