import { ReactNode } from "react";
import { useMesureWidget } from "@/components/_commons/Widget/TuileWidget/useMesureWidget";
import { clsxm } from "@/utils/clsxm";

export const ComplementsCartographie = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isModeM } = useMesureWidget();

  return (
    <div className={clsxm("flex", isModeM ? "flex-row flex-wrap" : "flex-col")}>
      {children}
    </div>
  );
};
