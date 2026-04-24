"use client"

import "@workspace/ui/globals.css"
import Error from "@/components/topui/error"

export default function NotFound() {
  return (
    <Error
      src="/svg/404.svg"
      alt="404"
      title="这页可能在外星球度假了 👽"
      description="地址可能写错了，或页面已搬家。先回到首页，从导航重新出发吧。"
      buttonText="飞回首页基地 🛸"
      herf="/"
    />
  )
}
