"use client";

import { Button } from "@stackloom/ui/components/button";
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
      <SidebarHeader>
        <SidebarProjects />
      </SidebarHeader>
      <SidebarContent>
        <Button>登录</Button>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
