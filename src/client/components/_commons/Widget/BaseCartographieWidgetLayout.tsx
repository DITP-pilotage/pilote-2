import { ReactNode } from "react";
import { useMesureWidget } from "@/components/_commons/Widget/TuileWidget/useMesureWidget";
import { clsxm } from "@/utils/clsxm";

export const TitreWidget = ({ children }: { children: ReactNode }) => {
  const { isModeP } = useMesureWidget();

  return (
    <span
      className={clsxm("fr-text font-bold", {
        "text-center": !isModeP,
      })}
    >
      {children}
    </span>
  );
};

export const BaseCartographieWidgetLayout = ({
  titre,
  cartographie,
  complementsCartographie,
  children,
  footer,
}: {
  titre?: ReactNode;
  cartographie: ReactNode;
  complementsCartographie?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) => {
  const { isModeG } = useMesureWidget();

  if (isModeG) {
    return (
      <div className="flex flex-col gap-2 h-full">
        <div
          className={clsxm("grid gap-8", {
            "grid-cols-2": children !== undefined,
            "grid-cols-1": children === undefined,
          })}
        >
          <div className="flex flex-col gap-4 max-w-[400px] mx-auto">
            {titre}
            {cartographie}
            {complementsCartographie}
          </div>
          {children !== undefined && (
            <div className="flex flex-col gap-2">{children}</div>
          )}
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {titre}
      <div className="w-full max-w-[400px] mx-auto">{cartographie}</div>
      {complementsCartographie}
      {children !== undefined && (
        <div className="flex flex-col gap-2 grow">{children}</div>
      )}
      {footer}
    </div>
  );
};
