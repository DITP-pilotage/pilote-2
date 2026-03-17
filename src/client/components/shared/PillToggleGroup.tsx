"use client";

import { ToggleGroup } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";

export const PillToggleGroup = Object.assign({}, ToggleGroup, {
  Root: ({ children, ...props }: ComponentProps<typeof ToggleGroup.Root>) => (
    <ToggleGroup.Root
      {...props}
      className={clsxm(
        "flex flex-wrap flex-col items-center md:flex-row md:justify-center gap-2",
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
        "!leading-none rounded-full px-2 py-2 text-[10px] font-medium flex items-center gap-1.5",
        "data-[state=on]:bg-dsfr-blue-france-925 data-[state=off]:bg-dsfr-alt-blue-france",
        "text-dsfr-blue-france-sun-113",
        props.className,
      )}
    >
      {children}
    </ToggleGroup.Item>
  ),
});
