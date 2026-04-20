"use client"

import dayjs, { type ConfigType } from "dayjs"

import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)
dayjs.extend(timezone)

export const isAfter = (date: ConfigType, compare: ConfigType) => {
  return dayjs(date).isAfter(dayjs(compare))
}

export const formatTime = ({
  date,
  dateFormat,
}: {
  date: ConfigType
  dateFormat: string
}) => {
  return dayjs(date).format(dateFormat)
}

export const formatDate = (date: ConfigType, dateFormat: string) => {
  return dayjs(date).format(dateFormat)
}

export const formatDateTime = (date: ConfigType) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss")
}

/**
 * PostgreSQL timestamptz
 * @param date
 * @param timezoneName
 * @returns
 */
export const formatDateTimeAt = (
  date: ConfigType,
  timezoneName: string = "Asia/Shanghai"
) => {
  // Format date at the specified IANA timezone (default: China Standard Time, Asia/Shanghai)
  try {
    return dayjs(date).tz(timezoneName).format("YYYY-MM-DD HH:mm:ss")
  } catch {
    // Fallback to local formatting if timezone plugin is unavailable
    return dayjs(date).format("YYYY-MM-DD HH:mm:ss")
  }
}

/**
 * 将 UTC 时间（如 PostgreSQL timestamp）转换为中国时间
 */
export const formatUtcToCn = (
  date: ConfigType,
  formatStr: string = "YYYY-MM-DD HH:mm:ss"
) => {
  return dayjs.utc(date).tz("Asia/Shanghai").format(formatStr)
}

interface FormatOptions {
  dateTimeFormat?: string
  timeFormat?: string
  invalidFallback?: string
}

export function formatForDisplay(
  input: ConfigType,
  {
    dateTimeFormat = "YYYY-MM-DD HH:mm",
    timeFormat = "HH:mm",
    invalidFallback = "",
  }: FormatOptions = {}
): string {
  const d = dayjs(input)
  if (!d.isValid()) return invalidFallback

  return d.isSame(dayjs(), "day")
    ? d.format(timeFormat)
    : d.format(dateTimeFormat)
}

/// 毫秒转秒 保留2位小数
export const msToSeconds = (ms: number) => {
  return (ms / 1000).toFixed(2)
}

/// 生成当前时期戳
export const generateTimestamp = () => {
  return dayjs().unix()
}
