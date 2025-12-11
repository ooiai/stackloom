"use client";

import { useBuilder } from "@stackloom/builder-ui/contexts/builder-context";
import Logo from "@stackloom/ui/loomui/logo";
import { BuilderMenu } from "../canvas/builder-menu";

export function BuilderHeader() {
  const { logo } = useBuilder();
  return (
    <header className="w-full h-16 bg-transparent flex items-center justify-between px-4 z-30">
      <div>
        <Logo src={logo} alt="logo" size={10} fallback="SL" />
      </div>
      <div>
        <BuilderMenu />
      </div>
      <div></div>
    </header>
  );
}
