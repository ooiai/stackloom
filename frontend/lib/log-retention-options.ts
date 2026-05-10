export const RETENTION_OPTIONS = [
  { label: 'Keep all', value: null },      // 保留（默认）
  { label: '1 week', value: 7 },
  { label: '1 month', value: 30 },
  { label: '3 months', value: 90 },
  { label: '6 months', value: 180 },
  { label: '1 year', value: 365 },
] as const
