import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";

export const AnimateEntry = ({
  visible,
  children,
  className,
  ...props
}: {
  visible: boolean;
} & ComponentProps<"div">) => (
  <div
    className={clsxm(
      "grid transition-[grid-template-rows] duration-200",
      visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      className,
    )}
    {...props}
  >
    <div className="overflow-hidden" inert={!visible ? true : undefined}>
      {children}
    </div>
  </div>
);
