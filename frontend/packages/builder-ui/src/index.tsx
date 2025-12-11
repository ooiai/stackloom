"use client";

import {
  SidebarInset,
  SidebarProvider,
} from "@stackloom/ui/components/sidebar";
import "@stackloom/ui/globals.css";
import { BuilderEditor } from "./components/editor";
import { EditorHeader } from "./components/layout/editor-header";
import { NavSidebar } from "./components/sidebar/nav-sidebar";
import "./index.css";
import { BuilderProvider, useBuilder } from "./providers/builder-provider";

export type { BuilderCtxData } from "./types/builder.types";
export { BuilderProvider, useBuilder };

const DesignBuilder = () => {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <NavSidebar />
      <SidebarInset>
        <EditorHeader />
        <BuilderEditor />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DesignBuilder;
