"use client";

import DesignBuilder, {
  BuilderCtxData,
  BuilderProvider,
} from "@stackloom/builder-ui/index";
import {
  BotMessageSquare,
  Component,
  Layers,
  LayoutTemplate,
  Palette,
} from "lucide-react";

export default function DesignPage() {
  const builderData: BuilderCtxData = {
    space: {
      logo: "/svg/logo.svg",
      href: "/",
      alt: "StackLoom",
    },
    user: {
      name: "Jerry Chir",
      email: "",
      avatar: "",
    },
    navMain: [
      {
        type: "page",
        title: "Page",
        icon: Layers,
        isActive: false,
      },
      {
        type: "ai",
        title: "AI",
        icon: BotMessageSquare,
        isActive: true,
      },
      {
        type: "component",
        title: "Component",
        icon: Component,
        isActive: false,
      },
      {
        type: "template",
        title: "Template",
        icon: LayoutTemplate,
        isActive: false,
      },
      {
        type: "theme",
        title: "Theme",
        icon: Palette,
        isActive: false,
      },
    ],
  };

  return (
    <BuilderProvider data={builderData}>
      <DesignBuilder />
    </BuilderProvider>
  );
}
