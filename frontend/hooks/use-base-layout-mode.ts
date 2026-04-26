"use client"

import { useState } from "react"

import { getStorageItem, setStorageItem } from "@/hooks/use-persisted-state"
import type { LayoutWidthMode } from "@/components/base/shared/layout-width-toggle"

const STORAGE_KEY = "base-layout-width-mode"

function isLayoutWidthMode(value: unknown): value is LayoutWidthMode {
  return value === "contained" || value === "full"
}

export function useBaseLayoutMode() {
  const [mode, setMode] = useState<LayoutWidthMode>(() => {
    const storedMode = getStorageItem(STORAGE_KEY)
    if (isLayoutWidthMode(storedMode)) {
      return storedMode
    }

    return "contained"
  })

  const updateMode = (nextMode: LayoutWidthMode) => {
    setMode(nextMode)
    setStorageItem(STORAGE_KEY, nextMode)
  }

  return {
    mode,
    isFullWidth: mode === "full",
    setMode: updateMode,
  }
}
