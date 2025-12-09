"use client";

import { BuilderStore } from "@/types/builder-store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The builder store.
 */
export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set, get) => ({
      currentTheme: null,
      setCurrentTheme: (theme: string) =>
        set(() => ({
          currentTheme: theme,
        })),
    }),
    {
      name: "design-store",
    },
  ),
);
