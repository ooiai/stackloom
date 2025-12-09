"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@stackloom/ui/components/sidebar";
import * as React from "react";
import { SidebarProjects } from "./sidebar-projects";

export function EditorSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} side="right">
      <SidebarHeader>
        <SidebarProjects />
      </SidebarHeader>
      <SidebarContent></SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
