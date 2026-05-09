"use client"

import { useQuery } from "@tanstack/react-query"

import { sharedApi } from "@/stores/base-api"

export const MY_TENANTS_QUERY_KEY = ["myTenants"] as const

export function useMyTenants() {
  return useQuery({
    queryKey: [...MY_TENANTS_QUERY_KEY],
    queryFn: () => sharedApi.getMyTenants(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}
