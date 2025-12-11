"use client";

import Logo from "@stackloom/ui/loomui/logo";
import { useBuilder } from "../../providers/builder-provider";
import { BuilderMenu } from "./builder-menu";

export function BuilderHeader() {
  const { data } = useBuilder();
  return (
    <header className="w-full h-16 bg-transparent flex items-center justify-between px-4 z-30">
      <div>
        <Logo
          src={data.space?.logo || ""}
          alt={data.space?.alt || ""}
          size={data.space?.size || 10}
          fallback={data.space?.sn || "SL"}
        />
      </div>
      <div>
        <BuilderMenu />
      </div>
      <div></div>
    </header>
  );
}
