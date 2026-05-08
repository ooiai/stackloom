"use client"

import { useQuery } from "@tanstack/react-query"

import { sharedApi } from "@/stores/base-api"

export const HEADER_CONTEXT_QUERY_KEY = ["headerContext"] as const

export function useHeaderContext() {
  const query = useQuery({
    queryKey: [...HEADER_CONTEXT_QUERY_KEY],
    queryFn: () => sharedApi.getHeaderContext(),
    staleTime: Number.POSITIVE_INFINITY,
  })

  return {
    ...query,
    user: query.data?.user ?? null,
    menuCodes: query.data?.menu_codes ?? [],
    permCodes: query.data?.perm_codes ?? [],
  }
}
