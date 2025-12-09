"use client";

import {
  SidebarInset,
  SidebarProvider,
} from "@stackloom/ui/components/sidebar";
import { cn } from "@stackloom/ui/lib/utils";
import { EditorSidebar } from "./components/sidebar/editor-sidebar";
import { WorkSidebar } from "./components/sidebar/work-sidebar";
import "./index.css";

const DesignBuilder = () => {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen justify-between">
        <WorkSidebar />
        <SidebarInset>
          <main
            className={cn(
              "flex-1 transition-all duration-300 overflow-auto relative bg-dotted pt-14 scrollbar-hide",
            )}
          >
            Design Builder Component
          </main>
        </SidebarInset>
        <EditorSidebar />
      </div>
    </SidebarProvider>
  );
};

export default DesignBuilder;
