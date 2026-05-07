import type { LucideIcon, LucideProps } from "lucide-react"
import * as LucideIcons from "lucide-react"
import React from "react"
import * as RemixIcons from "@remixicon/react"

export type IconName = keyof typeof LucideIcons

export function LucideIcon({
  name,
  fallback = null,
  ...props
}: { name: IconName; fallback?: React.ReactNode } & LucideProps) {
  const Icon = LucideIcons[name] as LucideIcon | undefined
  if (!Icon) return <>{fallback}</>
  return <Icon {...props} />
}

export function getLucideIcon(name?: IconName): LucideIcon | undefined {
  if (!name) return undefined
  return LucideIcons[name] as LucideIcon | undefined
}

export type RemixIconName = keyof typeof RemixIcons

export function RemixIcon({
  name,
  fallback = null,
  ...props
}: {
  name: RemixIconName
  fallback?: React.ReactNode
} & React.SVGProps<SVGSVGElement>) {
  const Icon = (
    RemixIcons as Record<
      string,
      React.ComponentType<React.SVGProps<SVGSVGElement>>
    >
  )[name]
  if (!Icon) return <>{fallback}</>
  return <Icon {...props} />
}

// <RemixIcon name="home-2-line" size={20} color="#333" />

// <LucideIcon name="User" size={20} color="#555" />
// getLucideIcon("User") 返回的是 Icons.User，可以直接传给需要 LucideIcon 类型的 prop
