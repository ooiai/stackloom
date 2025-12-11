"use client";

import {
  SidebarInset,
  SidebarProvider,
} from "@stackloom/ui/components/sidebar";
import "@stackloom/ui/globals.css";
import "./index.css";
import { BuilderProvider, useBuilder } from "./providers/builder-provider";
export type { BuilderCtxData } from "./types/builder.types";

export { BuilderProvider, useBuilder };

const CanvasBuilder = () => {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <SidebarInset></SidebarInset>
    </SidebarProvider>
  );
};

export default CanvasBuilder;
