"use client"

import { useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Building2Icon, CheckCircle2Icon } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import type { SigninTenantOption } from "@/types/auth.types"

const isTenantSelectable = (tenant: SigninTenantOption) => tenant.status === 1

const getDefaultSelectedMembershipId = (tenants: SigninTenantOption[]) => {
  return (
    tenants.find(isTenantSelectable)?.membership_id || tenants[0]?.membership_id || ""
  )
}

interface SigninTenantDialogProps {
  open: boolean
  tenants: SigninTenantOption[]
  loading?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit?: (tenant: SigninTenantOption) => void | Promise<void>
}

export function SigninTenantDialog({
  open,
  tenants,
  loading = false,
  onOpenChange,
  onSubmit,
}: SigninTenantDialogProps) {
  const { locale, t } = useI18n()
  const [selectedMembershipId, setSelectedMembershipId] = useState("")
  const resolvedSelectedMembershipId = tenants.some(
    (tenant) => tenant.membership_id === selectedMembershipId
  )
    ? selectedMembershipId
    : getDefaultSelectedMembershipId(tenants)

  const selectedTenant = useMemo(
    () =>
      tenants.find((tenant) => tenant.membership_id === resolvedSelectedMembershipId),
    [resolvedSelectedMembershipId, tenants]
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
                {t("auth.tenantDialog.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-6 text-muted-foreground">
                {t("auth.tenantDialog.description")}
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="space-y-3">
            {tenants.map((tenant) => {
              const selectable = isTenantSelectable(tenant)
              const active = resolvedSelectedMembershipId === tenant.membership_id
              const userLabel =
                tenant.display_name || tenant.nickname || tenant.username

              return (
                <Button
                  key={tenant.membership_id}
                  type="button"
                  variant="ghost"
                  disabled={!selectable || loading}
                  onClick={() => setSelectedMembershipId(tenant.membership_id)}
                  className={cn(
                    "h-auto w-full justify-start gap-3 rounded-2xl border px-4 py-3 text-left whitespace-normal transition-colors",
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
                      {tenant.tenant_name}
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {userLabel || "-"} ·{" "}
                      {tenant.role_names.join(
                        locale === "zh-CN" ? "、" : ", "
                      ) || t("auth.tenantDialog.unassignedRoles")}
                    </p>
                    {!selectable ? (
                      <p className="text-xs text-amber-600">
                        {t("auth.tenantDialog.unavailable")}
                      </p>
                    ) : null}
                  </div>
                </Button>
              )
            })}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close
              render={<Button type="button" variant="outline" />}
            >
              {t("auth.tenantDialog.cancel")}
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
              {t("auth.tenantDialog.confirm")}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
