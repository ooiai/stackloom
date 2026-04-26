"use client"

import { type ChangeEvent, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { FieldGroup } from "@/components/ui/field"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { UserMutateFormFields } from "@/components/base/users/user-mutate-form-fields"
import { UserMutateSheetHeader } from "@/components/base/users/user-mutate-sheet-header"
import {
  useUserMutateForm,
} from "@/components/base/users/hooks/use-user-mutate-form"
import {
  UserMutateAvatarSection,
  UserMutateSheetFooter,
} from "@/components/base/users/user-mutate-sheet-sections"
import { useAwsS3 } from "@/hooks/use-aws-s3"
import { uploadAwsObject } from "@/lib/aws"
import { OSS_ENUM } from "@/lib/config/enums"
import { getUserDisplayName } from "@/lib/users"
import { awsApi } from "@/stores/system-api"
import type {
  UserData,
  UserFormValues,
  UserMutateMode,
} from "@/types/base.types"

interface UserMutateSheetProps {
  open: boolean
  mode: UserMutateMode
  user: UserData | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UserFormValues) => Promise<void>
}

interface UserMutateSheetHeader {
  title: string
  description: string
  submitLabel: string
}

const SHEET_HEADER_MAP: Record<UserMutateMode, UserMutateSheetHeader> = {
  create: {
    title: "新增用户",
    description: "录入基础信息并创建用户",
    submitLabel: "创建用户",
  },
  update: {
    title: "编辑用户",
    description: "维护当前用户资料",
    submitLabel: "保存变更",
  },
}

export function UserMutateSheet({
  open,
  mode,
  user,
  isPending,
  onOpenChange,
  onSubmit,
}: UserMutateSheetProps) {
  const { uploadFile } = useAwsS3()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const header = SHEET_HEADER_MAP[mode]
  const { defaultValues, form } = useUserMutateForm({ mode, user, onSubmit })

  const resetFormState = () => {
    form.reset(defaultValues)
    setShowPassword(false)
    setIsUploadingAvatar(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetFormState()
    } else {
      setShowPassword(false)
      setIsUploadingAvatar(false)
    }

    onOpenChange(nextOpen)
  }

  const handleCancel = () => {
    resetFormState()
    onOpenChange(false)
  }

  const handleAvatarFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件作为头像")
      return
    }

    try {
      setIsUploadingAvatar(true)
      const avatarUrl = await uploadAwsObject({
        file,
        folder: OSS_ENUM.IMAGES,
        uploadFile,
        getSts: () => awsApi.getSts({}),
      })
      form.setFieldValue("avatar_url", avatarUrl)
      form.setFieldMeta("avatar_url", (prev) => ({
        ...prev,
        errors: [],
        isTouched: true,
      }))
      toast.success("头像上传成功")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "头像上传失败，请稍后重试"
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const values = form.state.values
  const avatarLabel = useMemo(
    () =>
      getUserDisplayName({
        nickname: values.nickname,
        username: values.username || "用户头像",
      }) || "用户头像",
    [values.nickname, values.username]
  )

  const isBusy = isPending || isUploadingAvatar || form.state.isSubmitting

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-184">
        <UserMutateSheetHeader
          title={header.title}
          description={header.description}
        />

        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 pt-2 pb-6">
            <UserMutateAvatarSection
              avatarLabel={avatarLabel}
              values={values}
              isUploadingAvatar={isUploadingAvatar}
              fileInputRef={fileInputRef}
              onAvatarFileChange={handleAvatarFileChange}
            />

            <FieldGroup>
              <UserMutateFormFields
                form={form}
                mode={mode}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
              />
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 bg-muted/20 px-5 py-4">
            <UserMutateSheetFooter
              isBusy={isBusy}
              submitLabel={header.submitLabel}
              onCancel={handleCancel}
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
