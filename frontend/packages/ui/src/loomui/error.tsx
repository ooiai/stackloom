"use client";

import { Button } from "../components/button";

type Props = {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  herf?: string;
};

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
      <img
        src={src}
        alt={alt}
        width={0}
        height={0}
        className="mb-24 w-3xl h-auto"
      />
      <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-gray-50">
        {title || "页面丢失了"}
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {description || "抱歉，您访问的页面不存在或已被移除。"}
      </p>
      {buttonText && (
        <Button asChild className="group mt-8">
          <a href={herf}>{buttonText}</a>
        </Button>
      )}
    </div>
  );
}
