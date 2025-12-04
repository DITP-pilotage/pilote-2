import { Switch as BaseSwitch } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";

export const Switch = Object.assign({}, BaseSwitch, {
  Root: ({
    children,
    className,
    ...props
  }: ComponentProps<typeof BaseSwitch.Root>) => (
    <BaseSwitch.Root
      className={clsxm(
        "w-11 relative !p-0",
        "rounded-full border !border-primary",
        "bg-white transition-colors data-[state=checked]:!bg-primary",
        {
          "!border-gray-500 data-[state=checked]:!bg-gray-300": props.disabled,
        },
        className,
      )}
      {...props}
    >
      {children}
    </BaseSwitch.Root>
  ),
  Thumb: ({
    className,
    disabled,
    ...props
  }: ComponentProps<typeof BaseSwitch.Thumb> & { disabled?: boolean }) => (
    <BaseSwitch.Thumb
      className={clsxm(
        "h-7 w-7 block",
        "rounded-full border !border-primary",
        "translate-x-0 transition-transform data-[state=checked]:!translate-x-4",
        "bg-white",
        { "!border-gray-500 !text-gray-500": disabled },
        "children:!hidden data-[state=checked]:children:!block",
        "flex items-center justify-center",
        className,
      )}
      {...props}
    >
      <Icone className="h-5 w-5 text-current" icone={CheckLineIcon} />
    </BaseSwitch.Thumb>
  ),
});
