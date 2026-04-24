"use client"

import { useMemo, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import { Textarea } from "@/components/reui/textarea"
import {
  USER_GENDER_OPTIONS,
  USER_STATUS_OPTIONS,
  getDefaultUserFormValues,
  getUserAvatarFallback,
  validateUserForm,
} from "@/lib/users"
import type {
  UserData,
  UserFormValues,
  UserMutateMode,
} from "@/types/base.types"
import { Loader2Icon, ShieldCheckIcon, UserRoundIcon } from "lucide-react"

interface UserMutateSheetProps {
  open: boolean
  mode: UserMutateMode
  user: UserData | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UserFormValues) => Promise<void>
}

export function UserMutateSheet({
  open,
  mode,
  user,
  isPending,
  onOpenChange,
  onSubmit,
}: UserMutateSheetProps) {
  const [values, setValues] = useState<UserFormValues>(
    getDefaultUserFormValues(user)
  )
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({})

  const header = useMemo(
    () =>
      mode === "create"
        ? {
            title: "新增用户",
            description: "优先填写最关键的身份与联络信息，降低首次录入负担。",
            submitLabel: "创建用户",
          }
        : {
            title: "编辑用户",
            description: "只修改需要调整的资料，用户名保留为只读主标识。",
            submitLabel: "保存变更",
          },
    [mode]
  )

  const handleFieldChange = <T extends keyof UserFormValues>(
    key: T,
    value: UserFormValues[T]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async () => {
    const nextErrors = validateUserForm(mode, values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    await onSubmit(values)
  }

  const avatarLabel =
    values.nickname.trim() || values.username.trim() || "用户头像预览"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader className="border-b border-border/70 pb-4">
          <SheetTitle>{header.title}</SheetTitle>
          <SheetDescription>{header.description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            <section className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarImage src={values.avatar_url} alt={avatarLabel} />
                  <AvatarFallback>{getUserAvatarFallback(values)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {avatarLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    头像、昵称和状态会直接影响列表中的识别效率。
                  </p>
                </div>
              </div>
            </section>

            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="username">用户名</FieldLabel>
                  <FieldContent>
                    <Input
                      id="username"
                      value={values.username}
                      disabled={mode === "update"}
                      onChange={(event) =>
                        handleFieldChange("username", event.target.value)
                      }
                      placeholder="请输入用户名"
                    />
                    {mode === "update" ? (
                      <FieldDescription>用户名创建后不可修改。</FieldDescription>
                    ) : null}
                    <FieldError>{errors.username}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="nickname">昵称</FieldLabel>
                  <FieldContent>
                    <Input
                      id="nickname"
                      value={values.nickname}
                      onChange={(event) =>
                        handleFieldChange("nickname", event.target.value)
                      }
                      placeholder="用于列表主展示名称"
                    />
                    <FieldError>{errors.nickname}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">邮箱</FieldLabel>
                  <FieldContent>
                    <Input
                      id="email"
                      type="email"
                      value={values.email}
                      onChange={(event) =>
                        handleFieldChange("email", event.target.value)
                      }
                      placeholder="name@example.com"
                    />
                    <FieldError>{errors.email}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">手机号</FieldLabel>
                  <FieldContent>
                    <Input
                      id="phone"
                      value={values.phone}
                      onChange={(event) =>
                        handleFieldChange("phone", event.target.value)
                      }
                      placeholder="请输入手机号"
                    />
                    <FieldError>{errors.phone}</FieldError>
                  </FieldContent>
                </Field>

                {mode === "create" ? (
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="password">登录密码</FieldLabel>
                    <FieldContent>
                      <Input
                        id="password"
                        type="password"
                        value={values.password}
                        onChange={(event) =>
                          handleFieldChange("password", event.target.value)
                        }
                        placeholder="至少 8 位，保存前会做 bcrypt hash"
                      />
                      <FieldDescription>
                        仅创建时需要录入，提交前会在浏览器端转换为
                        `password_hash`。
                      </FieldDescription>
                      <FieldError>{errors.password}</FieldError>
                    </FieldContent>
                  </Field>
                ) : null}
              </div>

              <FieldSeparator>资料展示</FieldSeparator>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <Field>
                  <FieldLabel htmlFor="avatar_url">头像地址</FieldLabel>
                  <FieldContent>
                    <Input
                      id="avatar_url"
                      value={values.avatar_url}
                      onChange={(event) =>
                        handleFieldChange("avatar_url", event.target.value)
                      }
                      placeholder="https://example.com/avatar.png"
                    />
                    <FieldError>{errors.avatar_url}</FieldError>
                  </FieldContent>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>性别</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(values.gender)}
                        onValueChange={(value) =>
                          handleFieldChange("gender", Number(value) as 0 | 1 | 2)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_GENDER_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={String(option.value)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>状态</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(values.status)}
                        onValueChange={(value) =>
                          handleFieldChange("status", Number(value) as 0 | 1 | 2)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_STATUS_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={String(option.value)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                </div>
              </div>

              <Field>
                <FieldLabel htmlFor="bio">个人简介</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="bio"
                    value={values.bio}
                    onChange={(event) =>
                      handleFieldChange("bio", event.target.value)
                    }
                    placeholder="补充用户的角色背景、团队归属或备注信息"
                    className="min-h-28"
                  />
                  <FieldDescription>
                    在长列表里，简短但有辨识度的备注更利于快速判断。
                  </FieldDescription>
                  <FieldError>{errors.bio}</FieldError>
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/70 pt-4 sm:flex-row sm:justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              {mode === "create" ? (
                <>
                  <UserRoundIcon className="size-3.5" />
                  创建后即可在列表中继续编辑和删除。
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="size-3.5" />
                  保存后会自动刷新列表数据。
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                取消
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={isPending}>
                {isPending ? <Loader2Icon className="animate-spin" /> : null}
                {header.submitLabel}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
