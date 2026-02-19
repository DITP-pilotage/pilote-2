"use client";

import { ToggleGroup } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";

export const SegmentedControl = Object.assign({}, ToggleGroup, {
  Root: ({ children, ...props }: ComponentProps<typeof ToggleGroup.Root>) => (
    <ToggleGroup.Root
      {...props}
      className={clsxm(
        "flex rounded bg-dsfr-alt-blue-france p-1 gap-2",
        props.className,
      )}
    >
      {children}
    </ToggleGroup.Root>
  ),
  Item: ({ children, ...props }: ComponentProps<typeof ToggleGroup.Item>) => (
    <ToggleGroup.Item
      {...props}
      className={clsxm(
        "flex-1 rounded px-3 py-1 text-sm font-medium transition-colors",
        "data-[state=on]:bg-primary data-[state=on]:text-white",
        "disabled:opacity-50",
        props.className,
      )}
    >
      {children}
    </ToggleGroup.Item>
  ),
});
