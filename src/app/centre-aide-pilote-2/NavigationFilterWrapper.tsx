"use client";

import { SessionProvider } from "next-auth/react";
import { NavigationFilter } from "@/client/components/CentreAide/NavigationFilter";

export function NavigationFilterWrapper() {
  return (
    <SessionProvider>
      <NavigationFilter />
    </SessionProvider>
  );
}
