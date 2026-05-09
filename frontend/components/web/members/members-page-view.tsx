"use client"

import { Dot, Search, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useHeaderContext } from "@/hooks/use-header-context"
import { formatDateTimeAt } from "@/lib/time"
import type { TenantMemberData } from "@/types/web.types"
import { getAvatarFallback, getMemberRoleLabel } from "./helpers"

interface MembersPageViewProps {
  members: TenantMemberData[]
  total: number
  isFetching: boolean
  keyword: string
  setKeyword: (value: string) => void
}

export function MembersPageView({
  members,
  total,
  isFetching,
  keyword,
  setKeyword,
}: MembersPageViewProps) {
  const t = useTranslations("members")
  const { user } = useHeaderContext()
  const workspaceName = user?.tenant_name ?? ""

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header card */}
        <div className="flex justify-between gap-4 rounded-lg bg-muted/90 px-6 py-5 max-[32rem]:flex-col min-[32rem]:items-center">
          <div>
            <h2 className="font-medium text-lg">{t("page.title")}</h2>
            <div className="mt-0.5 flex items-center text-muted-foreground text-sm">
              {workspaceName && <span>{workspaceName}</span>}
              {workspaceName && <Dot className="size-4 shrink-0" />}
              <span>{t("page.memberCount", { count: total })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 w-48 h-9"
                placeholder={t("page.search")}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <Button disabled>
              <UserPlus />
              {t("page.inviteMembers")}
            </Button>
          </div>
        </div>

        {/* Members table */}
        <Table className="mt-5">
          <TableHeader>
            <TableRow className="*:py-3 *:first:ps-6 *:last:pe-6">
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.email")}</TableHead>
              <TableHead>{t("table.role")}</TableHead>
              <TableHead>{t("table.joined")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 && !isFetching ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  <p className="font-medium">{t("page.emptyTitle")}</p>
                  <p className="mt-1 text-sm">{t("page.emptyDescription")}</p>
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow
                  key={member.id}
                  className="*:py-3 *:first:ps-6 *:last:pe-6"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-7 shrink-0">
                        {member.avatar_url && (
                          <AvatarImage
                            src={member.avatar_url}
                            alt={member.username}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {getAvatarFallback(member.nickname, member.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">
                          {member.display_name ?? member.nickname ?? member.username}
                        </p>
                        {member.job_title && (
                          <p className="truncate text-xs text-muted-foreground">
                            {member.job_title}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {member.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.is_tenant_admin ? "default" : "outline"}
                      className="text-xs"
                    >
                      {getMemberRoleLabel(member.is_tenant_admin, t)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTimeAt(member.joined_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
