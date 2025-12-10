"use client";

import "@stackloom/ui/globals.css";
import { SpinnerOverlay } from "@stackloom/ui/loomui/spinner-overlay";

export default function Loading() {
  return <SpinnerOverlay visible delay={300} />;
}
