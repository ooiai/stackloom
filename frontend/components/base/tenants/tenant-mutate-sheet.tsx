"use client"

import { type ChangeEvent, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { TenantMutateFormFields } from "@/components/base/tenants/tenant-mutate-form-fields"
import { useTenantMutateForm } from "@/components/base/tenants/hooks/use-tenant-mutate-form"
import { TenantMutateSheetHeader } from "@/components/base/tenants/tenant-mutate-sheet-header"
import {
  TenantMutateLogoSection,
  TenantMutateSheetFooter,
} from "@/components/base/tenants/tenant-mutate-sheet-sections"
import { FieldGroup } from "@/components/ui/field"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { useAwsS3 } from "@/hooks/use-aws-s3"
import {
  SINGLE_REQUEST_UPLOAD_PART_SIZE_BYTES,
  uploadAwsObject,
} from "@/lib/aws"
import { OSS_ENUM } from "@/lib/config/enums"
import {
  AVATAR_IMAGE_COMPRESSION_OPTIONS,
  compressImageFile,
} from "@/lib/image"
import { useI18n } from "@/providers/i18n-provider"
import { awsApi } from "@/stores/system-api"
import type {
  TenantData,
  TenantFormValues,
  TenantMutateMode,
} from "@/types/base.types"

interface TenantMutateSheetProps {
  open: boolean
  mode: TenantMutateMode
  tenant: TenantData | null
  parent: TenantData | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TenantFormValues) => Promise<void>
}

export function TenantMutateSheet({
  open,
  mode,
  tenant,
  parent,
  isPending,
  onOpenChange,
  onSubmit,
}: TenantMutateSheetProps) {
  const { t } = useI18n()
  const { uploadFile } = useAwsS3()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const header =
    mode === "create"
      ? {
          title: t("tenants.sheet.create.title"),
          description: t("tenants.sheet.create.description"),
          submitLabel: t("tenants.sheet.create.submit"),
        }
      : {
          title: t("tenants.sheet.update.title"),
          description: t("tenants.sheet.update.description"),
          submitLabel: t("tenants.sheet.update.submit"),
        }

  const parentLabel = useMemo(() => {
    if (!parent) {
      return t("common.misc.rootDirectory")
    }

    return parent.name
  }, [parent, t])
  const { defaultValues, form } = useTenantMutateForm({
    mode,
    tenant,
    parent,
    onSubmit,
  })

  const resetFormState = () => {
    form.reset(defaultValues)
    setIsUploadingLogo(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetFormState()
    } else {
      setIsUploadingLogo(false)
    }
    onOpenChange(nextOpen)
  }

  const handleCancel = () => {
    resetFormState()
    onOpenChange(false)
  }

  const handleLogoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error(t("tenants.toast.logoInvalid"))
      return
    }

    try {
      setIsUploadingLogo(true)
      const compressedFile = await compressImageFile(
        file,
        AVATAR_IMAGE_COMPRESSION_OPTIONS
      )
      const logoUrl = await uploadAwsObject({
        file: compressedFile,
        folder: OSS_ENUM.IMAGES,
        uploadFile,
        getSts: () => awsApi.getSts({}),
        uploadOptions: {
          partSizeBytes: SINGLE_REQUEST_UPLOAD_PART_SIZE_BYTES,
        },
      })
      form.setFieldValue("logo_url", logoUrl)
      form.setFieldMeta("logo_url", (prev) => ({
        ...prev,
        errors: [],
        isTouched: true,
      }))
      toast.success(t("tenants.toast.logoUploaded"))
    } catch (error) {
      console.error("[logo upload]", error)
      toast.error(
        error instanceof Error
          ? error.message
          : t("tenants.toast.logoUploadFailed")
      )
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const values = form.state.values
  const logoLabel = useMemo(
    () => values.name.trim() || t("tenants.form.logo_url.defaultName"),
    [t, values.name]
  )

  const isBusy = isPending || isUploadingLogo || form.state.isSubmitting

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <TenantMutateSheetHeader
          title={header.title}
          description={header.description}
        />

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <TenantMutateLogoSection
              logoLabel={logoLabel}
              values={values}
              isUploadingLogo={isUploadingLogo}
              fileInputRef={fileInputRef}
              onLogoFileChange={handleLogoFileChange}
            />

            <FieldGroup>
              <TenantMutateFormFields form={form} parentLabel={parentLabel} />
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 px-5 py-4 sm:flex-row sm:justify-end">
            <TenantMutateSheetFooter
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
