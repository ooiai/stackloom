"use client"

import { MembersPageView } from "@/components/web/members/members-page-view"
import { useMembersController } from "@/components/web/members/hooks/use-members-controller"

export default function MemberPage() {
  const ctrl = useMembersController()
  return <MembersPageView {...ctrl} />
}
