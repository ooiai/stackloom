"use client"

import { SpinnerOverlay } from "@/components/topui/spinner-overlay"

export default function BaseLoading() {
  return <SpinnerOverlay visible delay={300} />
}
