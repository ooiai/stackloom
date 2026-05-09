"use client"

import { Suspense } from "react"

import { JoinPageView } from "@/components/web/join/join-page-view"
import { useJoinController } from "@/components/web/join/hooks/use-join-controller"

function JoinPageInner() {
  const ctrl = useJoinController()
  return <JoinPageView {...ctrl} />
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinPageInner />
    </Suspense>
  )
}
