export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatPercent(used: number, total: number): number {
  if (total === 0) return 0
  return Math.round((used / total) * 100)
}

export function formatUptime(secs: number): string {
  const days = Math.floor(secs / 86400)
  const hours = Math.floor((secs % 86400) / 3600)
  const minutes = Math.floor((secs % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatHour(isoString: string): string {
  if (!isoString) return ""
  const d = new Date(isoString)
  return `${String(d.getUTCHours()).padStart(2, "0")}:00`
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "-"
  return new Date(isoString).toLocaleString()
}
