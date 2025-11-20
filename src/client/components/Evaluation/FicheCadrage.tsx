import { Critere, Objectif } from "@/server/evaluation/queries/types";
import { FicheCadrageCritere } from "@/components/Evaluation/FicheCadrageCritere";
import { FicheCadrageObjectif } from "@/components/Evaluation/FicheCadrageObjectif";

export type CritereOuObjectif =
  | { type: "critere"; critere: Critere }
  | {
      type: "objectif";
      objectif: Omit<Objectif, "evaluations"> & { ficheEvaluationId: string };
    };

export const FicheCadrage = ({
  critereOuObjectif,
}: {
  critereOuObjectif: CritereOuObjectif | null;
}) => {
  return (
    <div className="w-[var(--col-width)] bg-dsfr-alt-blue-france border-l border-gray-200 inset-shadow-xs">
      <aside className="sticky top-0 p-6 h-screen relative">
        <div className="absolute inset-0 p-6 overflow-y-auto">
          {critereOuObjectif?.type === "critere" && (
            <FicheCadrageCritere
              critere={critereOuObjectif.critere}
              key={critereOuObjectif.critere.id}
            />
          )}
          {critereOuObjectif?.type === "objectif" && (
            <FicheCadrageObjectif
              key={critereOuObjectif.objectif.id}
              objectif={critereOuObjectif.objectif}
            />
          )}
        </div>
      </aside>
    </div>
  );
};
