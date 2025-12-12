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
import { BuilderCtxData } from "./types/builder.types";

export type { BuilderCtxData } from "./types/builder.types";
export { BuilderProvider, useBuilder };

type Props = { data: BuilderCtxData };

const DesignBuilder = ({ data }: Props) => {
  return (
    <BuilderProvider data={data}>
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
    </BuilderProvider>
  );
};

export default DesignBuilder;
