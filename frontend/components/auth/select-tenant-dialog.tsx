"use client"

import { useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Building2Icon, CheckCircle2Icon } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { ListSelectOrgunit } from "@/types/auth.types"

const isTenantSelectable = (tenant: ListSelectOrgunit) => tenant.status === 0

const getDefaultSelectedOuid = (tenants: ListSelectOrgunit[]) => {
  return tenants.find(isTenantSelectable)?.ouid || tenants[0]?.ouid || ""
}

interface SelectTenantDialogProps {
  open: boolean
  tenants: ListSelectOrgunit[]
  loading?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit?: (tenant: ListSelectOrgunit) => void | Promise<void>
}

export function SelectTenantDialog({
  open,
  tenants,
  loading = false,
  onOpenChange,
  onSubmit,
}: SelectTenantDialogProps) {
  const [selectedOuid, setSelectedOuid] = useState("")
  const resolvedSelectedOuid = tenants.some(
    (tenant) => tenant.ouid === selectedOuid
  )
    ? selectedOuid
    : getDefaultSelectedOuid(tenants)

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.ouid === resolvedSelectedOuid),
    [resolvedSelectedOuid, tenants]
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border/70 bg-background p-6 shadow-2xl outline-none">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/30">
              <Image
                src="/images/logo.png"
                alt="Stackloom"
                width={28}
                height={28}
                className="h-7 w-auto"
              />
            </div>
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-left text-lg font-semibold">
                选择登录组织
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-6 text-muted-foreground">
                当前账号绑定了多个组织，请先选择要进入的租户或校区。
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="space-y-3">
            {tenants.map((tenant) => {
              const selectable = isTenantSelectable(tenant)
              const active = resolvedSelectedOuid === tenant.ouid

              return (
                <button
                  key={tenant.ouid}
                  type="button"
                  disabled={!selectable || loading}
                  onClick={() => setSelectedOuid(tenant.ouid)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                    active
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/70 bg-background hover:bg-muted/30",
                    !selectable && "cursor-not-allowed opacity-55"
                  )}
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    {active ? (
                      <CheckCircle2Icon className="size-4 text-primary" />
                    ) : (
                      <Building2Icon className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {tenant.ouname} ({tenant.tname})
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {(tenant.dname || tenant.nname || tenant.uname) ?? "-"} ·{" "}
                      {tenant.rnames.join("、") || "未分配角色"}
                    </p>
                    {!selectable ? (
                      <p className="text-xs text-amber-600">当前组织暂不可登录</p>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close
              render={<Button type="button" variant="outline" />}
            >
              取消
            </DialogPrimitive.Close>
            <Button
              type="button"
              disabled={loading || !selectedTenant || !isTenantSelectable(selectedTenant)}
              onClick={() => {
                if (selectedTenant) {
                  void onSubmit?.(selectedTenant)
                }
              }}
            >
              {loading ? <Spinner className="size-4" /> : null}
              确认登录
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
