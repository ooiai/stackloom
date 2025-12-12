"use client";

import React from "react";
import { BuilderCtxData } from "../types/builder.types";

export type BuilderCtxValue = { config: BuilderCtxData };
const BuilderContext = React.createContext<BuilderCtxValue | null>(null);

export function BuilderProvider({
  config,
  children,
}: {
  config: BuilderCtxData;
  children: React.ReactNode;
}) {
  return (
    <BuilderContext.Provider value={{ config }}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const ctx = React.useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}
