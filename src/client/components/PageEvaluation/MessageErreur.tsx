import { PropsWithChildren } from "react";
import { clsxm } from "@/utils/clsxm";

export const MessageErreur = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <span className={clsxm("text-xs text-error whitespace-nowrap", className)}>
    {children}
  </span>
);
