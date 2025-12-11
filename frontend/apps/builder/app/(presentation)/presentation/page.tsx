"use client";

import PresentationBuilder, {
  BuilderCtxData,
  BuilderProvider,
} from "@stackloom/presentation-ui/index";
import { BotMessageSquare, Layers, Palette } from "lucide-react";

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
        type: "theme",
        title: "Theme",
        icon: Palette,
        isActive: false,
      },
    ],
  };

  return (
    <BuilderProvider data={builderData}>
      <PresentationBuilder />
    </BuilderProvider>
  );
}
