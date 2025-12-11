"use client";

import CanvasBuilder, {
  BuilderCtxData,
  BuilderProvider,
} from "@stackloom/canvas-ui/index";

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
    tools: [],
  };

  return (
    <BuilderProvider data={builderData}>
      <CanvasBuilder />
    </BuilderProvider>
  );
}
