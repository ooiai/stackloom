"use client";

import { NavSidebar } from "./components/sidebar/nav-sidebar";
import { BuilderProvider, useBuilder } from "./contexts/builder-context";

import {
  SidebarInset,
  SidebarProvider,
} from "@stackloom/ui/components/sidebar";
import "@stackloom/ui/globals.css";
import { BuilderEditor } from "./components/editor";
import { EditorHeader } from "./components/layout/editor-header";
import "./index.css";
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
