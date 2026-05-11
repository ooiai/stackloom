"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface MonitorSparklineProps {
  /** Raw numeric values in time order (oldest → newest). */
  data: number[]
  color?: string
}

export function MonitorSparkline({
  data,
  color = "var(--chart-1)",
}: MonitorSparklineProps) {
  if (data.length < 2) return null

  const points = data.map((v, i) => ({ i, v }))

  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.12}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
