"use client";

import { Button } from "@stackloom/ui/components/button";
import { ButtonGroup } from "@stackloom/ui/components/button-group";
import { Separator } from "@stackloom/ui/components/separator";
import { SidebarTrigger } from "@stackloom/ui/components/sidebar";
import { Tooltips } from "@stackloom/ui/loomui/tooltip";
import { Eye, Monitor, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";

export function EditorHeader() {
  return (
    <header className="bg-background sticky top-0 z-50 flex shrink-0 items-center justify-between gap-3.5 border-b p-4">
      <div className="flex items-center">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        {/*<Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">All Inboxes</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>*/}
      </div>
      <div></div>
      <div className="flex items-center gap-3.5">
        <ButtonGroup>
          <Tooltips content="Undo Action">
            <Button variant="outline" size="icon-sm" aria-label="Undo">
              <Undo2 />
            </Button>
          </Tooltips>
          <Tooltips content="Redo Action">
            <Button variant="outline" size="icon-sm" aria-label="Undo">
              <Redo2 />
            </Button>
          </Tooltips>
        </ButtonGroup>
        <ButtonGroup>
          <Tooltips content="Large Viewport">
            <Button variant="outline" size="icon-sm" aria-label="Undo">
              <Monitor />
            </Button>
          </Tooltips>
          <Tooltips content="Medium Viewport">
            <Button variant="outline" size="icon-sm" aria-label="Undo">
              <Tablet />
            </Button>
          </Tooltips>
          <Tooltips content="Small Viewport">
            <Button variant="outline" size="icon-sm" aria-label="Undo">
              <Smartphone />
            </Button>
          </Tooltips>
        </ButtonGroup>

        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4" />
          Preview
        </Button>
        {/*<Button>
          <Globe className="h-4 w-4" />
          Publish
        </Button>*/}
      </div>
    </header>
  );
}
