"use client";

import DesignBuilder, {
  BuilderCtxData,
  BuilderProvider,
} from "@stackloom/builder-ui/index";
import { Bot, Component, Layers, LayoutTemplate } from "lucide-react";

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
        title: "AI",
        icon: Bot,
        isActive: true,
      },
      {
        title: "Outline",
        icon: Layers,
        isActive: false,
      },
      {
        title: "Component",
        icon: Component,
        isActive: false,
      },
      {
        title: "Template",
        icon: LayoutTemplate,
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
