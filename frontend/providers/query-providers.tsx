"use client"

import {
  QueryClient,
  QueryClientProvider,
  environmentManager,
} from "@tanstack/react-query"
// import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental"
import * as React from "react"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // staleTime: 60 * 1000,
        retry: 1,
        // retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient()
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export function QueryProviders(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {/*<ReactQueryStreamedHydration>*/}
      {props.children}
      {/*</ReactQueryStreamedHydration>*/}
      {/*<ReactQueryDevtools initialIsOpen={false} />*/}
    </QueryClientProvider>
  )
}
