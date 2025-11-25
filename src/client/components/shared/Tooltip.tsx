import { Tooltip as RadixTooltip } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";

export const Tooltip = Object.assign({}, RadixTooltip, {
  Content: ({
    children,
    ...props
  }: ComponentProps<typeof RadixTooltip.Content>) => (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        {...props}
        className={clsxm(
          props.className,
          "bg-gray-900 text-white rounded px-3 py-2 text-sm z-50",
          "data-[state=delayed-open]:animate-tooltip-fade-in data-[state=closed]:animate-tooltip-fade-out",
        )}
        sideOffset={5}
      >
        {children}
        <RadixTooltip.Arrow className="fill-gray-900" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  ),
  Trigger: (props: ComponentProps<"button">) => (
    <button
      type="button"
      {...props}
      className={clsxm(
        "block !-mx-2 !-my-1 !px-2 py-1 rounded hover:bg-gray-200 bg-transparent transition-color font-medium",
        props.className,
      )}
    />
  ),
});
