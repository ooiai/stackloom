"use client"

export type PermissionCode = string
export type PermissionSet = ReadonlySet<PermissionCode>

export function buildPermissionSet(
  codes: readonly PermissionCode[] | null | undefined
): PermissionSet {
  return new Set((codes ?? []).filter((code) => code.length > 0))
}

export function hasPerm(
  permSet: PermissionSet,
  code: PermissionCode | null | undefined
): boolean {
  if (!code) {
    return false
  }

  return permSet.has(code)
}

export function hasAnyPerm(
  permSet: PermissionSet,
  codes: readonly PermissionCode[]
): boolean {
  return codes.some((code) => hasPerm(permSet, code))
}

export function hasAllPerms(
  permSet: PermissionSet,
  codes: readonly PermissionCode[]
): boolean {
  return codes.every((code) => hasPerm(permSet, code))
}
