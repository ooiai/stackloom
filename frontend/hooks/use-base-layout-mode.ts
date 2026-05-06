"use client"

import { useSyncExternalStore } from "react"

import { getStorageItem, setStorageItem } from "@/hooks/use-persisted-state"
import type { LayoutWidthMode } from "@/components/base/shared/layout-width-toggle"

const STORAGE_KEY = "base-layout-width-mode"
const STORAGE_EVENT = "base-layout-width-mode-change"

function isLayoutWidthMode(value: unknown): value is LayoutWidthMode {
  return value === "contained" || value === "full"
}

function getStoredLayoutMode(): LayoutWidthMode {
  const storedMode = getStorageItem(STORAGE_KEY)
  return isLayoutWidthMode(storedMode) ? storedMode : "full"
}

function subscribeLayoutMode(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.storageArea === window.localStorage) {
      onStoreChange()
    }
  }

  const handleCustomEvent = () => {
    onStoreChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(STORAGE_EVENT, handleCustomEvent)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(STORAGE_EVENT, handleCustomEvent)
  }
}

export function useBaseLayoutMode() {
  const mode: LayoutWidthMode = useSyncExternalStore(
    subscribeLayoutMode,
    getStoredLayoutMode,
    () => "full"
  )

  const updateMode = (nextMode: LayoutWidthMode) => {
    setStorageItem(STORAGE_KEY, nextMode)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(STORAGE_EVENT))
    }
  }

  return {
    mode,
    isFullWidth: mode === "full",
    setMode: updateMode,
  }
}
