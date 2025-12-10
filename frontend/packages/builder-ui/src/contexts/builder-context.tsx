"use client";

import React from "react";

export type BuilderCtxValue = { logo: string };
const BuilderContext = React.createContext<BuilderCtxValue | null>(null);

export function BuilderProvider({
  logo,
  children,
}: {
  logo: string;
  children: React.ReactNode;
}) {
  return (
    <BuilderContext.Provider value={{ logo }}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const ctx = React.useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}
