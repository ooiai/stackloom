"use client"

import { useState } from "react"

import {
  Dot,
  MoreHorizontal,
  Phone,
  Search,
  UserPlus,
  Users2,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { UseMutationResult } from "@tanstack/react-query"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useHeaderContext } from "@/hooks/use-header-context"
import type {
  TenantMemberData,
  UpdateMemberStatusParam,
} from "@/types/web.types"
import { getMemberRoleLabel } from "./helpers"
import { MembersInviteDialog } from "./members-invite-dialog"
import { getNameAbbr } from "@/lib/core"

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-teal-500",
]

function getAvatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]
}

interface StatusBadgeProps {
  status: number
  t: (key: string) => string
}

function StatusBadge({ status, t }: StatusBadgeProps) {
  if (status === 1) {
    return (
      <Badge variant="success-light" size="sm">
        {t("status.normal")}
      </Badge>
    )
  }
  if (status === 2) {
    return (
      <Badge variant="warning-light" size="sm">
        {t("status.pending")}
      </Badge>
    )
  }
  return (
    <Badge variant="destructive-light" size="sm">
      {t("status.disabled")}
    </Badge>
  )
}

interface MembersPageViewProps {
  members: TenantMemberData[]
  total: number
  isFetching: boolean
  keyword: string
  setKeyword: (value: string) => void
  isAdmin: boolean
  updateStatusMutation: UseMutationResult<void, Error, UpdateMemberStatusParam>
}

export function MembersPageView({
  members,
  total,
  isFetching,
  keyword,
  setKeyword,
  isAdmin,
  updateStatusMutation,
}: MembersPageViewProps) {
  const t = useTranslations("members")
  const { user } = useHeaderContext()
  const workspaceName = user?.tenant_name ?? ""
  const [inviteOpen, setInviteOpen] = useState(false)

  // Find the current user's role to display in the header.
  const currentMember = user
    ? members.find((m) => m.user_id === user.id)
    : undefined

  const colSpan = isAdmin ? 6 : 5

  return (
    <div className="w-full px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header card */}
        <div className="flex justify-between gap-4 rounded-xl bg-muted/70 px-6 py-5 max-[32rem]:flex-col min-[32rem]:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{t("page.title")}</h2>
              {currentMember && (
                <Badge variant="primary-light" size="sm">
                  {t("page.yourRole")}:{" "}
                  {getMemberRoleLabel(currentMember.is_tenant_admin, t)}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center text-sm text-muted-foreground">
              {workspaceName && (
                <span className="font-medium">{workspaceName}</span>
              )}
              {workspaceName && <Dot className="size-4 shrink-0" />}
              <span>{t("page.memberCount", { count: total })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-48 pl-8"
                placeholder={t("page.search")}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            {isAdmin && (
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus />
                {t("page.inviteMembers")}
              </Button>
            )}
          </div>
        </div>

        {/* Members table */}
        <Table className="mt-4">
          <TableHeader>
            <TableRow className="*:py-3 *:first:ps-6 *:last:pe-6 hover:bg-transparent">
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.email")}</TableHead>
              <TableHead>{t("table.phone")}</TableHead>
              <TableHead>{t("table.role")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              {isAdmin && (
                <TableHead className="text-right">
                  {t("table.actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && members.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="*:py-3 *:first:ps-6 *:last:pe-6">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 shrink-0 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3.5 w-36 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3.5 w-24 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-14 rounded" />
                  </TableCell>
                  {isAdmin && <TableCell />}
                </TableRow>
              ))
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="rounded-full bg-muted p-3">
                      <Users2 className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t("page.emptyTitle")}
                      </p>
                      <p className="mt-1 text-xs">
                        {t("page.emptyDescription")}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
                const isCurrentUser = member.user_id === user?.id
                const avatarColor = getAvatarColor(member.user_id)
                const displayName =
                  member.display_name ?? member.nickname ?? member.username

                return (
                  <TableRow
                    key={member.id}
                    className="*:py-3 *:first:ps-6 *:last:pe-6"
                  >
                    {/* Name + avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 shrink-0">
                          {member.avatar_url && (
                            <AvatarImage
                              src={member.avatar_url}
                              alt={member.username}
                            />
                          )}
                          <AvatarFallback
                            className={`${avatarColor} text-xs font-semibold text-white`}
                          >
                            {getNameAbbr(
                              member.nickname ??
                                member.display_name ??
                                member.username
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-medium">
                              {displayName}
                            </p>
                            {isCurrentUser && (
                              <Badge variant="secondary" size="xs">
                                You
                              </Badge>
                            )}
                          </div>
                          {/*{member.job_title && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {member.job_title}
                            </p>
                          )}*/}
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {member.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-sm text-muted-foreground">
                      {member.email ?? "—"}
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-sm text-muted-foreground">
                      {member.phone ? (
                        <span className="inline-flex items-center gap-1">
                          {/*<Phone className="size-3 shrink-0" />*/}
                          {member.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge
                        variant={
                          member.is_tenant_admin
                            ? "primary-light"
                            : "success-light"
                        }
                        size="sm"
                      >
                        {getMemberRoleLabel(member.is_tenant_admin, t)}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={member.status} t={t} />
                    </TableCell>

                    {/* Admin actions */}
                    {isAdmin && (
                      <TableCell className="text-right">
                        {!isCurrentUser && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  disabled={updateStatusMutation.isPending}
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.status !== 1 ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      member_id: member.id,
                                      status: 1,
                                    })
                                  }
                                >
                                  {t("actions.enable")}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      member_id: member.id,
                                      status: 0,
                                    })
                                  }
                                >
                                  {t("actions.disable")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <MembersInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
