"use client";

import Logo from "@stackloom/ui/loomui/logo";
import { BuilderMenu } from "../canvas/builder-menu";

export function BuilderHeader() {
  return (
    <header className="w-full h-16 bg-transparent flex items-center justify-between px-4 z-30">
      <div>
        <Logo src="/svg/logo.tsx" alt="logo" size={10} fallback="SL" />
      </div>
      <div>
        <BuilderMenu />
      </div>
      <div></div>
    </header>
  );
}
