"use client";

import { Button } from "@stackloom/ui/components/button";
import { Label } from "@stackloom/ui/components/label";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@stackloom/ui/components/sidebar";
import { Tooltips } from "@stackloom/ui/loomui/tooltip";
import { Plus } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
};

export function PagePanel({ title = "Page", description }: Props) {
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
          <Label className="flex items-center gap-2 text-sm">
            {/*<span>Unreads</span>*/}
            {/*<Switch className="shadow-none" />*/}
            <Tooltips delayDuration={700} content="Add Page">
              <Button variant="outline" size="icon-sm" aria-label="Undo">
                <Plus />
              </Button>
            </Tooltips>
          </Label>
        </div>
        {/*<SidebarInput placeholder="Type to search..." />*/}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            {/*{mails.map((mail) => (
            <a
              href="#"
              key={mail.email}
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
            >
              <div className="flex w-full items-center gap-2">
                <span>{mail.name}</span>{" "}
                <span className="ml-auto text-xs">{mail.date}</span>
              </div>
              <span className="font-medium">{mail.subject}</span>
              <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
                {mail.teaser}
              </span>
            </a>
          ))}*/}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
