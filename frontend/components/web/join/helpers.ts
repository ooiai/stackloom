import { buildInviteSignupUrl, buildSigninWithReturnTo } from "@/lib/auth-navigation"
import { ROUTER_ENUM } from "@/lib/config/enums"

export { buildSigninWithReturnTo }

export function buildJoinUrl(origin: string, inviteCode: string): string {
  return `${origin}/join?code=${inviteCode}`
}

export function getJoinRedirectUrl(): string {
  return ROUTER_ENUM.DASHBOARD
}

export function buildSignupWithInviteCode(inviteCode: string): string {
  return buildInviteSignupUrl(inviteCode)
}
