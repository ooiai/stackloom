"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@stackloom/ui/components/breadcrumb";
import { Separator } from "@stackloom/ui/components/separator";
import { SidebarTrigger } from "@stackloom/ui/components/sidebar";

export function EditorHeader() {
  return (
    <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4 z-50">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">All Inboxes</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
