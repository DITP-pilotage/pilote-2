import { Critere, Objectif } from "@/server/evaluation/queries/types";
import { FicheCadrageCritere } from "@/components/Evaluation/FicheCadrageCritere";
import { FicheCadrageObjectif } from "@/components/Evaluation/FicheCadrageObjectif";

export type CritereOuObjectif =
  | { type: "critere"; critere: Critere }
  | { type: "objectif"; objectif: Objectif };

export const FicheCadrage = ({
  critereOuObjectif,
}: {
  critereOuObjectif: CritereOuObjectif | null;
}) => {
  return (
    <div className="w-full bg-dsfr-alt-blue-france border-l border-gray-200 inset-shadow-xs">
      <aside className="sticky top-0 p-6">
        {critereOuObjectif?.type === "critere" && (
          <FicheCadrageCritere critere={critereOuObjectif.critere} />
        )}
        {critereOuObjectif?.type === "objectif" && (
          <FicheCadrageObjectif objectif={critereOuObjectif.objectif} />
        )}
      </aside>
    </div>
  );
};
