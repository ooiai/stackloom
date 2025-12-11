"use client";

import { NavSidebar } from "./components/sidebar/nav-sidebar";
import { BuilderProvider, useBuilder } from "./contexts/builder-context";

import {
  SidebarInset,
  SidebarProvider,
} from "@stackloom/ui/components/sidebar";
import "@stackloom/ui/globals.css";
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
        <div className="flex flex-1 flex-col gap-4 p-4">
          {Array.from({ length: 24 }).map((_, index) => (
            <div
              key={index}
              className="bg-muted/50 aspect-video h-12 w-full rounded-lg"
            />
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DesignBuilder;
