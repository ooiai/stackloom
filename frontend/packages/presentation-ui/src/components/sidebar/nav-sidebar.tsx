"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@stackloom/ui/components/sidebar";
import Logo from "@stackloom/ui/loomui/logo";
import { useBuilder } from "../../providers/builder-provider";
import { NavUser } from "./nav-user";

export function NavSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data } = useBuilder();
  const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
  const { setOpen } = useSidebar();

  // Sidebar Header
  const renderSidebarHeader = React.useMemo(() => {
    return (
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
              <a href={data.space?.href || "/"}>
                <Logo
                  src={data.space?.logo || ""}
                  alt={data.space?.alt || ""}
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  }, [data.space]);

  // Sidebar Content
  const renderSidebarContent = React.useMemo(() => {
    return (
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={{
                      children: item.title,
                      hidden: false,
                    }}
                    onClick={() => {
                      setActiveItem(item);

                      setOpen(true);
                    }}
                    isActive={activeItem?.title === item.title}
                    className="px-2.5 md:px-2 mb-1"
                  >
                    <item.icon className="size-8" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    );
  }, [activeItem, data.navMain, setOpen]);

  // Sidebar Footer
  const renderSidebarFooter = React.useMemo(() => {
    return (
      <SidebarFooter>{data.user && <NavUser user={data.user} />}</SidebarFooter>
    );
  }, [data.user]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        {renderSidebarHeader}
        {renderSidebarContent}
        {renderSidebarFooter}
      </Sidebar>
    </Sidebar>
  );
}
