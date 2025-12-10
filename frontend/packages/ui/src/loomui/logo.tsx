"use client";

import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";

type Props = {
  src: string;
  alt?: string;
  fallback?: string;
};

export default function Logo({ src, alt, fallback }: Props) {
  return (
    <Avatar>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
