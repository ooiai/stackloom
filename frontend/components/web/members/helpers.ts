export function getMemberRoleLabel(
  isTenantAdmin: boolean,
  t: (key: string) => string,
): string {
  return isTenantAdmin ? t("roles.admin") : t("roles.member")
}

export function getAvatarFallback(
  nickname: string | null,
  username: string,
): string {
  const name = nickname ?? username
  return name.slice(0, 2).toUpperCase() || "?"
}
