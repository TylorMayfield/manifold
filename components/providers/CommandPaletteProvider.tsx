"use client";

import React from "react";
import CommandPalette from "../ui/CommandPalette";
import { useCommandPalette } from "../../hooks/useCommandPalette";

/**
 * CommandPaletteProvider - Global provider for the command palette
 *
 * This wraps the application and provides Cmd+K / Ctrl+K navigation
 */
export default function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, close } = useCommandPalette();

  return (
    <>
      {children}
      <CommandPalette isOpen={isOpen} onClose={close} />
    </>
  );
}
