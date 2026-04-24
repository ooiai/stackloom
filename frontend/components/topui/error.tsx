"use client"

import { Button } from "../ui/button"
import Image from "next/image"

type Props = {
  src: string
  alt?: string
  title?: string
  description?: string
  buttonText?: string
  herf?: string
}

export default function Error({
  src,
  alt,
  title,
  description,
  buttonText,
  herf,
}: Props) {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Image
        src={src}
        alt={alt || "error image"}
        width={1200}
        height={800}
        className="mb-24 h-auto w-3xl"
      />
      <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-gray-50">
        {title || "页面丢失了"}
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {description || "抱歉，您访问的页面不存在或已被移除。"}
      </p>
      {buttonText && (
        <Button className="group mt-8">
          <a href={herf}>{buttonText}</a>
        </Button>
      )}
    </div>
  )
}
