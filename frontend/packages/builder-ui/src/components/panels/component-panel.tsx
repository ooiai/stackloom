"use client";

import { Label } from "@stackloom/ui/components/label";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@stackloom/ui/components/sidebar";

type Props = {
  title?: string;
  description?: string;
};

export function ComponentPanel({ title = "Component", description }: Props) {
  return (
    <Sidebar collapsible="none" className="hidden flex-1 md:flex">
      <SidebarHeader className="gap-3.5 border-b px-4 py-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-foreground text-sm font-medium">{title}</div>
            <div
              className="text-muted-foreground text-xs truncate"
              hidden={!description}
            >
              {description}
            </div>
          </div>
          <Label className="flex items-center gap-2 text-sm size-8"></Label>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupContent></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
