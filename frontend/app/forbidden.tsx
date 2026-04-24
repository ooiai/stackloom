"use client"
import "./globals.css"
import Error from "@/components/topui/error"

export default function Forbidden() {
  return (
    <Error
      src="/svg/403.svg"
      alt="403"
      title="此路不通，权限警察在值班 👮"
      description="权限门禁把我们拦住了，换个账号试试，或联系管理员帮你开门。"
      buttonText="撤退到首页，重新集合 🧭"
      herf="/"
    />
  )
}
