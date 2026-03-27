import { Checkbox as BaseCheckbox } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";

export const Checkbox = ({
  className,
  ...props
}: ComponentProps<typeof BaseCheckbox.Root>) => {
  return (
    <BaseCheckbox.Root
      {...props}
      className={clsxm(
        "!border-2 !border-gray-500 w-4 h-4 transition-colors rounded flex items-center justify-center bg-white data-[state=checked]:!border-primary data-[state=checked]:!bg-primary data-[state=checked]:!text-white",
        className,
      )}
    >
      <BaseCheckbox.Indicator>
        <Icone className="w-4 h-4 text-current" icone={CheckLineIcon} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
};
