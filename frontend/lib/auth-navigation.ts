import { ROUTER_ENUM } from "@/lib/config/enums"

export function sanitizeReturnTo(returnTo?: string | null): string | null {
  if (!returnTo?.startsWith("/")) {
    return null
  }

  return returnTo
}

export function buildRouteWithReturnTo(route: string, returnTo?: string | null): string {
  const safeReturnTo = sanitizeReturnTo(returnTo)
  if (!safeReturnTo) {
    return route
  }

  return `${route}?returnTo=${encodeURIComponent(safeReturnTo)}`
}

export function buildSigninWithReturnTo(returnTo: string): string {
  return buildRouteWithReturnTo(ROUTER_ENUM.SIGNIN, returnTo)
}

export function buildInviteSignupUrl(inviteCode: string): string {
  return `${ROUTER_ENUM.SIGNUP}?inviteCode=${encodeURIComponent(inviteCode)}`
}

export function getCurrentReturnTo(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return sanitizeReturnTo(`${window.location.pathname}${window.location.search}`)
}

export function redirectToSigninWithCurrentPath(): void {
  if (typeof window === "undefined") {
    return
  }

  window.location.href = buildRouteWithReturnTo(
    ROUTER_ENUM.SIGNIN,
    getCurrentReturnTo()
  )
}
