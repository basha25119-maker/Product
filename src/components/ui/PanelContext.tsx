"use client";

import { createContext, useContext } from "react";

export const PanelContext = createContext<{ close: () => void } | null>(null);

/** Returns the enclosing NewRecordPanel's close handler, or undefined if not inside one. */
export function usePanelClose() {
  return useContext(PanelContext)?.close;
}
