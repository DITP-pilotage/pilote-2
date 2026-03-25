import { ReactNode } from "react";

export const TitreWidget = ({ children }: { children: ReactNode }) => (
  <span className="fr-text font-bold md:text-center">{children}</span>
);

export const BaseCartographieWidgetLayout = ({
  cartographie,
  children,
}: {
  cartographie: ReactNode;
  children: ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="max-w-[400px] mx-auto">{cartographie}</div>

      <div className="flex flex-col gap-2 grow">{children}</div>
    </div>
  );
};
