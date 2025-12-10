"use client";

import DesignBuilder, { BuilderProvider } from "@stackloom/builder-ui/index";

export default function DesignPage() {
  return (
    <BuilderProvider logo="/svg/logo.svg">
      <DesignBuilder />
    </BuilderProvider>
  );
}
