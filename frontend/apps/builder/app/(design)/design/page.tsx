"use client";

import DesignBuilder, { BuilderCtxData } from "@stackloom/builder-ui/index";
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
        description: "Manage your design pages.",
        icon: Layers,
        isActive: false,
      },
      {
        type: "ai",
        title: "AI",
        description: "Chat with your design to generate assets.",
        icon: BotMessageSquare,
        isActive: true,
      },
      {
        type: "component",
        title: "Component",
        description: "Choose from pre-built design components.",
        icon: Component,
        isActive: false,
      },
      {
        type: "template",
        title: "Template",
        description: "Choose from layout templates for your design.",
        icon: LayoutTemplate,
        isActive: false,
      },
      {
        type: "theme",
        title: "Theme",
        description: "Set up your design themes and styles.",
        icon: Palette,
        isActive: false,
      },
    ],
  };

  return <DesignBuilder config={builderData} data={[]} />;
}
