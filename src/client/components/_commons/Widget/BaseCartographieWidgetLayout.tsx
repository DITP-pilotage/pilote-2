import { forwardRef, ReactNode } from "react";
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

export const BaseCartographieWidgetLayout = forwardRef<
  HTMLDivElement,
  {
    titre?: ReactNode;
    cartographie: ReactNode;
    complementsCartographie?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
  }
>(({ titre, cartographie, complementsCartographie, children, footer }, ref) => {
  const { isModeG } = useMesureWidget();

  if (isModeG) {
    return (
      <div className="flex flex-col gap-8 h-full" ref={ref}>
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            {titre}
            {cartographie}
            {complementsCartographie}
          </div>
          <div className="flex flex-col gap-2">{children}</div>
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full" ref={ref}>
      {titre}
      <div className="w-full max-w-[400px] mx-auto">{cartographie}</div>
      {complementsCartographie}
      <div className="flex flex-col gap-2 grow">{children}</div>
      {footer}
    </div>
  );
});

BaseCartographieWidgetLayout.displayName = "BaseCartographieWidgetLayout";
