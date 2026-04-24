"use client"

import "./globals.css"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"

export default function Loading() {
  return <SpinnerOverlay visible delay={300} />
}
