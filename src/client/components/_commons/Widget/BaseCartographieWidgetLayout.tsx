import { ReactNode } from "react";

export const BaseCartographieWidgetLayout = ({
  cartographie,
  titre,
  children,
}: {
  cartographie: ReactNode;
  titre: string;
  children: ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-[400px] mx-auto">{cartographie}</div>

      <div className="flex flex-col gap-2 shrink-0">
        <span className="fr-text font-bold">{titre}</span>
        {children}
      </div>
    </div>
  );
};
