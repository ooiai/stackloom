import { ROUTER_ENUM } from "@/lib/config/enums"

export function buildJoinUrl(origin: string, inviteCode: string): string {
  return `${origin}/join?code=${inviteCode}`
}

export function getJoinRedirectUrl(): string {
  return ROUTER_ENUM.DASHBOARD
}

export function buildSigninWithReturnTo(returnTo: string): string {
  return `${ROUTER_ENUM.SIGNIN}?returnTo=${encodeURIComponent(returnTo)}`
}

export function buildSignupWithReturnTo(returnTo: string): string {
  return `${ROUTER_ENUM.SIGNUP}?returnTo=${encodeURIComponent(returnTo)}`
}
