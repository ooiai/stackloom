"use client"

import Image from "next/image"
import Link from "next/link"

import { SigninForm } from "@/components/auth/signin-form"

export default function SigninPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/svg/logo.svg"
              alt="Stackloom 品牌标识"
              width={0}
              height={0}
              priority
              className="h-auto w-10"
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <SigninForm />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-[#f5f7f9] lg:block">
        <div className="flex h-full w-auto flex-col items-center justify-center">
          <Image
            src="/svg/auth.svg"
            alt="身份与授权插画"
            width={0}
            height={0}
            priority
            className="mx-auto h-auto w-xl"
          />
          <span className="mt-8 text-xl font-semibold">
            Stackloom · 欢迎回来 ✨
          </span>
          <span className="mt-3 max-w-2xl text-sm text-muted-foreground italic">
            一次登录，直达后台 Admin 与业务端
            Web；从组织到权限，协作更统一、更稳定、更高效。
          </span>
        </div>
      </div>
    </div>
  )
}
