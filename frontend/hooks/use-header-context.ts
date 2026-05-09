"use client"

import { type QueryClient, useQuery } from "@tanstack/react-query"

import { sharedApi } from "@/stores/base-api"

export const HEADER_CONTEXT_QUERY_KEY = ["headerContext"] as const
export const CURRENT_MENUS_QUERY_KEY = ["listCurrentMenusQuery"] as const
export const HEADER_SHARED_STALE_TIME = 60 * 1000

export const headerSharedQueryOptions = {
  staleTime: HEADER_SHARED_STALE_TIME,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
} as const

export async function invalidateHeaderSharedQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: [...HEADER_CONTEXT_QUERY_KEY] }),
    queryClient.invalidateQueries({ queryKey: [...CURRENT_MENUS_QUERY_KEY] }),
  ])
}

export function useHeaderContext() {
  const query = useQuery({
    queryKey: [...HEADER_CONTEXT_QUERY_KEY],
    queryFn: () => sharedApi.getHeaderContext(),
    ...headerSharedQueryOptions,
  })

  return {
    ...query,
    user: query.data?.user ?? null,
    menuCodes: query.data?.menu_codes ?? [],
    permCodes: query.data?.perm_codes ?? [],
  }
}
