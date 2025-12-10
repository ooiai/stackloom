"use client";

import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";
import { cn } from "../lib/utils";

type Props = {
  src: string;
  className?: string;
  size?: number;
  alt?: string;
  fallback?: string;
};

export default function Logo({
  className,
  src,
  size = 8,
  alt,
  fallback,
}: Props) {
  return (
    <Avatar className={cn(className, `size-${size}`)}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
