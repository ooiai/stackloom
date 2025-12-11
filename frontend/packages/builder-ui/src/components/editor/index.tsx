"use client";

import { EditorSkeleton } from "../skeleton/editor-skeleton";

export function BuilderEditor() {
  const loading = true;
  if (loading) {
    console.log("loading editor skeleton");
    return <EditorSkeleton />;
  }
  return <div>BuilderEditor</div>;
}
