import { Checkbox as BaseCheckbox, Label } from "radix-ui";
import { ComponentProps, ReactNode, useId } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";

type CheckboxSize = "md" | "sm";

const SIZES: Record<CheckboxSize, string> = {
  md: "size-6",
  sm: "size-4",
};

type CheckboxProps = ComponentProps<typeof BaseCheckbox.Root> & {
  size?: CheckboxSize;
};

export const Checkbox = ({
  className,
  size = "md",
  ...props
}: CheckboxProps) => {
  return (
    <BaseCheckbox.Root
      {...props}
      className={clsxm(
        "shrink-0 flex items-center justify-center rounded bg-white border border-dsfr-blue-france-sun-113 text-dsfr-alt-blue-france transition-colors",
        "data-[state=checked]:bg-dsfr-blue-france-sun-113",
        "disabled:cursor-not-allowed disabled:border-dsfr-grey-925 disabled:text-dsfr-grey-625 disabled:data-[state=checked]:bg-dsfr-grey-925",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus",
        SIZES[size],
        className,
      )}
    >
      <BaseCheckbox.Indicator>
        <Icone className="size-4 text-current" icone={CheckLineIcon} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
};

type CheckboxFieldProps = Omit<CheckboxProps, "children"> & {
  label: ReactNode;
  hint?: ReactNode;
  labelClassName?: string;
  children?: ReactNode;
};

export const CheckboxField = ({
  id,
  label,
  hint,
  labelClassName,
  children,
  className,
  size = "md",
  ...props
}: CheckboxFieldProps) => {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className={clsxm("flex items-start gap-2", className)}>
      <Checkbox
        className={clsxm(size === "sm" && "mt-1")}
        id={checkboxId}
        size={size}
        {...props}
      />
      <div className="min-w-0">
        <Label.Root
          className={clsxm(
            "block text-base text-dsfr-grey-50 cursor-pointer",
            props.disabled && "cursor-not-allowed text-dsfr-grey-625",
            labelClassName,
          )}
          htmlFor={checkboxId}
        >
          {label}
          {hint ? (
            <span className="block text-xs text-dsfr-mention-grey">{hint}</span>
          ) : null}
        </Label.Root>
        {children}
      </div>
    </div>
  );
};
