"use client";

import {
  SidebarInset,
  SidebarProvider,
} from "@stackloom/ui/components/sidebar";
import "@stackloom/ui/globals.css";
import { cn } from "@stackloom/ui/lib/utils";
import { BuilderHeader } from "./components/layout/builder-header";
import { EditorSidebar } from "./components/sidebar/editor-sidebar";
import "./index.css";

type Props = {
  logo: string;
};

const DesignBuilder = ({ logo }: Props) => {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen justify-between">
        {/*<WorkSidebar />*/}
        <SidebarInset>
          <main
            className={cn(
              "flex-1 transition-all duration-300 overflow-auto relative bg-dotted scrollbar-hide",
            )}
          >
            <BuilderHeader />
            Design Builder Component rs
          </main>
        </SidebarInset>
        <EditorSidebar
          className="bg-accent"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={{ ["--sidebar" as any]: "#fff" }}
        />
      </div>
    </SidebarProvider>
  );
};

export default DesignBuilder;
