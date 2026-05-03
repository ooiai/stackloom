"use client"

import type { Filter } from "@/components/reui/filters"
import type { BadgeProps } from "@/components/reui/badge"
import { createFilter } from "@/components/reui/filters"
import type { TranslateFn } from "@/lib/i18n"

export type LogFilterValue = string | number

export const DEFAULT_PAGE_SIZE = 10

export function parsePageNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.floor(parsed)
}

export function parsePageSize(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
    return fallback
  }

  return Math.floor(parsed)
}

export function createStringFilterFromSearchParam(
  searchParams: { get: (key: string) => string | null },
  key: string,
  operator: "contains" | "is" = "contains"
) {
  const value = searchParams.get(key)?.trim()
  if (!value) {
    return null
  }

  return createFilter(key, operator, [value])
}

export function createNumberFilterFromSearchParam(
  searchParams: { get: (key: string) => string | null },
  key: string
) {
  const value = searchParams.get(key)
  if (!value) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return createFilter(key, "is", [parsed])
}

export function getStringFilterValue(
  filters: Filter<LogFilterValue>[],
  field: string
) {
  const filter = filters.find((item) => item.field === field)
  const candidate = filter?.values[0]

  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : undefined
}

export function getNumberFilterValue(
  filters: Filter<LogFilterValue>[],
  field: string
) {
  const filter = filters.find((item) => item.field === field)
  const candidate = filter?.values[0]

  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return candidate
  }

  if (typeof candidate === "string" && candidate.trim()) {
    const parsed = Number(candidate)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

export function formatLogValue(value: unknown, fallback = "—") {
  if (value == null) {
    return fallback
  }

  if (typeof value === "string") {
    return value.trim() ? value : fallback
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return fallback
}

export function formatLogJson(value: unknown) {
  if (value == null) {
    return "{}"
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return "{}"
  }
}

export function getStringResultMeta(result: string, t: TranslateFn) {
  const normalized = result.trim().toLowerCase()

  if (normalized === "success") {
    return {
      label: t("logs.common.result.success"),
      badgeVariant: "success-outline" as BadgeProps["variant"],
    }
  }

  if (normalized === "failure") {
    return {
      label: t("logs.common.result.failure"),
      badgeVariant: "destructive-outline" as BadgeProps["variant"],
    }
  }

  return {
    label: result || t("common.misc.none"),
    badgeVariant: "outline" as BadgeProps["variant"],
  }
}

export function getNumericResultMeta(result: number, t: TranslateFn) {
  if (result === 1) {
    return {
      label: t("logs.common.result.success"),
      badgeVariant: "success-outline" as BadgeProps["variant"],
    }
  }

  if (result === 0) {
    return {
      label: t("logs.common.result.failure"),
      badgeVariant: "destructive-outline" as BadgeProps["variant"],
    }
  }

  return {
    label: String(result),
    badgeVariant: "outline" as BadgeProps["variant"],
  }
}
