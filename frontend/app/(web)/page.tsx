"use client"

import { ROUTER_ENUM } from "@/lib/config/enums"
import { useEffect } from "react"

export default function HomePage() {
  useEffect(() => {
    window.location.href = ROUTER_ENUM.DASHBOARD
  }, [])
  return (
    <main className="mx-auto flex min-h-[70svh] max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center"></main>
  )
}
