import { Children, FunctionComponent, ReactNode, useMemo, useRef } from "react";
import { useContainerWidth } from "@/client/hooks/useContainerWidth";
import {
  TuileWidgetCtx,
  calculerTailleTuile,
  calculerModeDisposition,
} from "./TuileWidgetContext";

type TuileWidgetProps = {
  titre: string;
  children: ReactNode;
};

export const TuileWidget: FunctionComponent<TuileWidgetProps> = ({
  titre,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const largeurConteneur = useContainerWidth(ref);
  const colonnes = Children.toArray(children).length;

  const contextValue = useMemo(() => {
    const largeur = largeurConteneur ?? 0;
    return {
      tailleTuile: calculerTailleTuile(largeur),
      modeDisposition: calculerModeDisposition(largeur, colonnes),
    };
  }, [largeurConteneur, colonnes]);

  return (
    <TuileWidgetCtx.Provider value={contextValue}>
      <div className="fr-card fr-p-3w flex flex-col gap-4" ref={ref}>
        <span className="fr-text--xl font-bold fr-m-0">{titre}</span>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${colonnes}, 1fr)` }}
        >
          {Children.toArray(children).map((child, index) => (
            <div key={index}>{child}</div>
          ))}
        </div>
      </div>
    </TuileWidgetCtx.Provider>
  );
};
