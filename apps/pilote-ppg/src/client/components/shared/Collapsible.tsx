import { Collapsible as RadixCollapsible } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";

export const Collapsible = Object.assign({}, RadixCollapsible, {
  Content: ({
    className,
    ...props
  }: ComponentProps<typeof RadixCollapsible.Content>) => (
    <RadixCollapsible.Content
      {...props}
      className={clsxm("overflow-hidden", className)}
    />
  ),
});
