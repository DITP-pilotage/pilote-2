import { Progress as BaseProgress } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";

interface ProgressProps extends ComponentProps<typeof BaseProgress.Root> {
  indicatorClassName?: string;
}

export const Progress = ({
  className,
  indicatorClassName,
  value,
  max = 100,
  ...props
}: ProgressProps) => {
  const percentage =
    value != null ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

  return (
    <BaseProgress.Root
      {...props}
      className={clsxm("w-full overflow-hidden rounded-md", className)}
      max={max}
      value={value}
    >
      <BaseProgress.Indicator
        className={clsxm(
          "h-full rounded-md transition-all",
          indicatorClassName,
        )}
        style={{ width: `${percentage}%` }}
      />
    </BaseProgress.Root>
  );
};
