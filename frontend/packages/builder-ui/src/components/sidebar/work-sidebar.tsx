"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@stackloom/ui/components/sidebar";
import * as React from "react";
import { SidebarProjects } from "./sidebar-projects";

export function WorkSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} side="left">
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <SidebarProjects />
      </SidebarHeader>
      <SidebarContent></SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
