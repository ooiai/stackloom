"use client"

import { useState } from "react"

import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { VerifyParam } from "rc-slider-captcha"

import PasswordStrengthInput from "@/components/topui/password-strength-input"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { setStorageItem } from "@/hooks/use-persisted-state"
import { STORAGE_ENUM } from "@/lib/config/enums"
import { AuthTokenResult } from "@/lib/http/axios"
import { cn } from "@/lib/utils"
import { signinApi } from "@/stores/auth-api"
import type {
  AccountAuthParam,
  ListSelectOrgunit,
  QueryOrgUnitsParam,
} from "@/types/auth.types"
import type { SliderCaptcha } from "@/types/system.types"

import CaptchaSlider from "./captcha-slider"
import { SelectTenantDialog } from "./select-tenant-dialog"

const formSchema = z.object({
  account: z.string().min(1, "请输入手机号或账号名"),
  password: z.string().min(8, "密码至少需要 8 位"),
})

type FormValues = z.infer<typeof formSchema>
type FormErrors = Partial<Record<keyof FormValues, string>>

const DEFAULT_VALUES: FormValues = {
  account: "",
  password: "",
}

const DASHBOARD_ROUTE = "/upms/users"

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSlider, setShowSlider] = useState(false)
  const [showTenantDialog, setShowTenantDialog] = useState(false)
  const [captchaFormData, setCaptchaFormData] = useState<SliderCaptcha | null>(
    null
  )
  const [tenants, setTenants] = useState<ListSelectOrgunit[]>([])

  const queryOrgUnitsMutation = useMutation({
    mutationFn: (params: QueryOrgUnitsParam) => signinApi.queryOrgUnits(params),
    onError: () => {
      setShowSlider(false)
    },
  })

  const accountAuthMutation = useMutation({
    mutationFn: (params: AccountAuthParam) => signinApi.accountAuth(params),
    onSuccess: (data: AuthTokenResult) => {
      setStorageItem(
        STORAGE_ENUM.TOKEN,
        JSON.stringify(data),
        data.refreshExpiresAt
      )
      toast.success("登录成功")
      router.replace(DASHBOARD_ROUTE)
    },
    onError: () => {
      setShowSlider(false)
      setShowTenantDialog(false)
    },
  })

  const isLoading =
    queryOrgUnitsMutation.isPending || accountAuthMutation.isPending

  const updateValue = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) {
        return current
      }

      return { ...current, [key]: undefined }
    })
  }

  const validate = () => {
    const result = formSchema.safeParse(values)

    if (result.success) {
      setErrors({})
      return true
    }

    const nextErrors: FormErrors = {}
    for (const issue of result.error.issues) {
      const path = issue.path[0] as keyof FormValues | undefined
      if (path && !nextErrors[path]) {
        nextErrors[path] = issue.message
      }
    }

    setErrors(nextErrors)
    return false
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setShowTenantDialog(false)
    setShowSlider(true)
  }

  const handleVerifySuccess = async (verifyData: VerifyParam) => {
    const payload: SliderCaptcha = {
      account: values.account,
      password: values.password,
      code: JSON.stringify(verifyData),
    }

    const nextTenants = await queryOrgUnitsMutation.mutateAsync({
      account: payload.account,
      password: payload.password ?? "",
      code: payload.code,
    })

    if (!nextTenants.length) {
      setShowSlider(false)
      toast.error("当前账号没有可用的登录组织")
      return
    }

    setCaptchaFormData(payload)
    setTenants(nextTenants)
    setShowSlider(false)
    setShowTenantDialog(true)
  }

  return (
    <>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">登录您的账户</h1>
            <p className="text-sm text-balance text-muted-foreground">
              在下方输入您的账户以登录账户
            </p>
          </div>

          <Field data-invalid={!!errors.account}>
            <FieldLabel htmlFor="form-signin-account">账号/手机号</FieldLabel>
            <Input
              id="form-signin-account"
              type="text"
              placeholder="输入手机号或账号名"
              autoComplete="username"
              disabled={isLoading}
              value={values.account}
              onChange={(event) => updateValue("account", event.target.value)}
            />
            {errors.account ? <FieldError>{errors.account}</FieldError> : null}
          </Field>

          <Field data-invalid={!!errors.password}>
            <div className="flex items-center">
              <FieldLabel htmlFor="form-signin-password">密码</FieldLabel>
              <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                忘记密码？
              </a>
            </div>
            <PasswordStrengthInput
              id="form-signin-password"
              placeholder="输入 8 位以上密码"
              autoComplete="current-password"
              disabled={isLoading}
              value={values.password}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateValue("password", event.target.value)
              }
            />
            {errors.password ? (
              <FieldError>{errors.password}</FieldError>
            ) : null}
          </Field>

          {showSlider ? (
            <CaptchaSlider
              account={values.account}
              onVerifySuccess={handleVerifySuccess}
              onVerifyError={() => {
                setShowSlider(false)
              }}
            />
          ) : null}

          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="size-4" /> : null}
              登录
            </Button>
          </Field>

          <div className="text-center text-xs text-balance text-muted-foreground">
            点击登录即表示您同意{" "}
            <a
              className="text-primary underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
              href="#"
            >
              用户协议
            </a>{" "}
            和{" "}
            <a
              className="text-primary underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
              href="#"
            >
              隐私政策
            </a>
            。
          </div>

          <FieldSeparator>或使用以下方式继续</FieldSeparator>

          <Field>
            <Button variant="outline" type="button" className="w-full">
              导航至官网
            </Button>
            <FieldDescription className="text-center">
              如需开通账号，请联系系统管理员完成授权。
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>

      <SelectTenantDialog
        open={showTenantDialog}
        tenants={tenants}
        loading={accountAuthMutation.isPending}
        onOpenChange={setShowTenantDialog}
        onSubmit={async (tenant) => {
          if (!captchaFormData) {
            toast.error("验证码状态已失效，请重新登录")
            setShowTenantDialog(false)
            return
          }

          await accountAuthMutation.mutateAsync({
            account: captchaFormData.account,
            password: captchaFormData.password ?? "",
            code: captchaFormData.code,
            tid: tenant.tid,
            uid: tenant.uid,
            ouid: tenant.ouid,
            rids: tenant.rids,
            pids: tenant.pids,
          })
        }}
      />
    </>
  )
}
