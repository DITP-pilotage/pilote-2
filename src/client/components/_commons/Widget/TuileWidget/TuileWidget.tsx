import { Children, FunctionComponent, ReactNode, useMemo, useRef } from "react";
import { useContainerWidth } from "@/client/hooks/useContainerWidth";
import { calculerModeDisposition, MesureWidgetCtx } from "./useMesureWidget";

export const ColonneMesuree = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const largeur = useContainerWidth(ref);

  const contextValue = useMemo(
    () => ({
      modeDisposition: calculerModeDisposition(largeur ?? 0),
      largeur: largeur ?? 0,
    }),
    [largeur],
  );

  return (
    <MesureWidgetCtx.Provider value={contextValue}>
      <div ref={ref} className="flex flex-col gap-4">
        {children}
      </div>
    </MesureWidgetCtx.Provider>
  );
};

export const TuileWidget = ({
  titre,
  children,
}: {
  titre?: string;
  children: ReactNode;
}) => {
  const colonnes = Children.toArray(children).length;

  return (
    <div className="fr-card fr-p-3w flex flex-col gap-4">
      {titre && <span className="fr-text--xl font-bold fr-m-0">{titre}</span>}
      <div
        className="grid max-sm:!grid-cols-1 gap-14"
        style={{ gridTemplateColumns: `repeat(${colonnes}, 1fr)` }}
      >
        {Children.toArray(children).map((child, index) => (
          <ColonneMesuree key={index}>{child}</ColonneMesuree>
        ))}
      </div>
    </div>
  );
};
