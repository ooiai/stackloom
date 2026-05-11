"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/reui/badge"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/providers/i18n-provider"
import { SearchIcon, UsersIcon } from "lucide-react"

import type { NotificationUserOption } from "./helpers"

interface NotificationsUserPickerProps {
  users: NotificationUserOption[]
  selectedIds: string[]
  disabled?: boolean
  error?: string
  onToggle: (id: string) => void
}

export function NotificationsUserPicker({
  users,
  selectedIds,
  disabled = false,
  error,
  onToggle,
}: NotificationsUserPickerProps) {
  const { t } = useI18n()
  const [keyword, setKeyword] = useState("")

  const filteredUsers = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) {
      return users
    }

    return users.filter((user) => user.label.toLowerCase().includes(normalized))
  }, [keyword, users])

  return (
    <Field data-invalid={!!error}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel>{t("notifications.form.recipientUsers")}</FieldLabel>
        <Badge variant="primary-light" size="default" radius="full">
          {t("notifications.userPicker.selectedCount", {
            count: String(selectedIds.length),
          })}
        </Badge>
      </div>

      <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("notifications.userPicker.searchPlaceholder")}
            disabled={disabled}
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className="max-h-48 overflow-y-auto rounded-lg border border-border/70 bg-background">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <UsersIcon className="size-5 text-muted-foreground/60" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {keyword.trim()
                    ? t("notifications.userPicker.emptySearchTitle")
                    : t("notifications.userPicker.emptyDefaultTitle")}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {keyword.trim()
                    ? t("notifications.userPicker.emptySearchDescription")
                    : t("notifications.userPicker.emptyDefaultDescription")}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredUsers.map((user) => {
                const checked = selectedIds.includes(user.id)
                return (
                  <label
                    key={user.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors ${
                      checked ? "bg-primary/5" : "hover:bg-muted/40"
                    } ${disabled ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {user.label}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(user.id)}
                      disabled={disabled}
                      className="size-4 shrink-0"
                    />
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}
