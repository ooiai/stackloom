"use client";

import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { EditorSidebar } from "./components/sidebar/editor-sidebar";
import { WorkSidebar } from "./components/sidebar/work-sidebar";

const DesignBuilder = () => {
  return (
    <div>
      <SidebarProvider
        className="relative hidden md:block"
        style={{ "--sidebar-width": "300px" } as React.CSSProperties}
      >
        <WorkSidebar />
        <SidebarInset>Design Builder Component</SidebarInset>
        <EditorSidebar />
      </SidebarProvider>
    </div>
  );
};

export default DesignBuilder;
