"use client";

import { NavSidebar } from "./components/sidebar/nav-sidebar";
import { BuilderProvider, useBuilder } from "./contexts/builder-context";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stackloom/ui/components/breadcrumb";
import { Separator } from "@stackloom/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@stackloom/ui/components/sidebar";
import "@stackloom/ui/globals.css";
import "./index.css";
export type { BuilderCtxData } from "./types/builder.types";

export { BuilderProvider, useBuilder };

const DesignBuilder = () => {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <NavSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
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
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Inbox</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {Array.from({ length: 24 }).map((_, index) => (
            <div
              key={index}
              className="bg-muted/50 aspect-video h-12 w-full rounded-lg"
            />
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DesignBuilder;
