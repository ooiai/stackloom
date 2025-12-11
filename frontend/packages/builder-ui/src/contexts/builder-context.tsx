"use client";

import React from "react";
import { BuilderCtxData } from "../types/builder.types";

export type BuilderCtxValue = { data: BuilderCtxData };
const BuilderContext = React.createContext<BuilderCtxValue | null>(null);

export function BuilderProvider({
  data,
  children,
}: {
  data: BuilderCtxData;
  children: React.ReactNode;
}) {
  return (
    <BuilderContext.Provider value={{ data }}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const ctx = React.useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}
