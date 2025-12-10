"use client";

import { useBuilder } from "@stackloom/builder-ui/contexts/builder-context";
import Logo from "@stackloom/ui/loomui/logo";

export function BuilderHeader() {
  const { logo } = useBuilder();
  return (
    <header className="w-full h-16 bg-transparent flex items-center px-4 z-30">
      <Logo src={logo} alt="logo" size={10} fallback="SL" />
    </header>
  );
}
