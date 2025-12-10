"use client";

import React from "react";

type BuilderCtx = { ctx: string };
const BuilderContext = React.createContext<BuilderCtx | null>(null);

export function BuilderProvider({
  ctx,
  children,
}: {
  ctx: string;
  children: React.ReactNode;
}) {
  return (
    <BuilderContext.Provider value={{ ctx }}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const ctx = React.useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}
