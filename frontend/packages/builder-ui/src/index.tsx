"use client";

import { ScrollArea } from "@stackloom/ui/components/scroll-area";
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
import { PageConfig } from "./types/page.types";

export type { BuilderCtxData } from "./types/builder.types";
export { BuilderProvider, useBuilder };

type Props = { config: BuilderCtxData; data: PageConfig[] };

const DesignBuilder = ({ config, data }: Props) => {
  return (
    <BuilderProvider config={config}>
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
          <ScrollArea className="h-[calc(100vh-78px)]">
            <BuilderEditor />
          </ScrollArea>
          {/*<div>
            <BuilderEditor />
          </div>*/}
        </SidebarInset>
      </SidebarProvider>
    </BuilderProvider>
  );
};

export default DesignBuilder;
