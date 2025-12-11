"use client";

import { DefaultSkeleton } from "./defalut";

export function EditorSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {Array.from({ length: 24 }).map((_, index) => (
        <DefaultSkeleton key={index} />
      ))}
    </div>
  );
}
