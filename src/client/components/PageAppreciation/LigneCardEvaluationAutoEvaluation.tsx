import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";
import { BaseCardEvaluation } from "@/components/Evaluation/ListeAutoEvaluation/BaseCardEvaluation";
import {
  formatterTexteCompletion,
  formatterTitreEvaluation,
} from "@/components/PageAppreciation/utilsTexteEvaluation";
import { BarreProgressionEvaluation } from "@/components/Evaluation/ListeAutoEvaluation/BarreProgressionEvaluation";
import { clsxm } from "@/utils/clsxm";

export const LigneCardEvaluationAutoEvaluation = ({
  ficheEvaluation,
  afficherObjectifsCollectifs,
}: {
  ficheEvaluation: FicheEvaluation;
  afficherObjectifsCollectifs: boolean;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={clsxm("grid gap-4", {
          "md:grid-cols-3": afficherObjectifsCollectifs,
          "md:grid-cols-2": !afficherObjectifsCollectifs,
        })}
      >
        {afficherObjectifsCollectifs ? (
          <BaseCardEvaluation
            libelleMoyenne="taux d'avancement"
            lien={`/evaluation/note-collective/${ficheEvaluation.rattachement.code}`}
            moyenne={ficheEvaluation.noteCollective}
            rattachement={formatterTitreEvaluation(
              ficheEvaluation.rattachement,
            )}
            texteLienNavigation="Consulter la liste des objectifs collectifs"
            titre="Objectifs collectifs"
          >
            <div className="text-xs text-grey-200">
              Taux constaté dans PILOTE, en attente de la saisie finalisée des
              données par les ministères en charge des chantiers
            </div>
          </BaseCardEvaluation>
        ) : null}

        <BaseCardEvaluation
          libelleMoyenne="auto-évaluation"
          lien="TODO"
          moyenne={ficheEvaluation.objectifs.moyenne}
          rattachement={formatterTitreEvaluation(ficheEvaluation.rattachement)}
          statutCompletion={
            ficheEvaluation.objectifsValides ? "COMPLETER" : "NON_COMPLETE"
          }
          texteCompletion={formatterTexteCompletion({
            ...ficheEvaluation.objectifs,
            estValide: ficheEvaluation.objectifsValides,
          })}
          titre="Objectifs individuels"
        >
          <BarreProgressionEvaluation
            estValide={ficheEvaluation.objectifsValides}
            nombreNotes={ficheEvaluation.objectifs.nombreNotes}
            nombreTotal={ficheEvaluation.objectifs.nombreTotal}
          />
        </BaseCardEvaluation>
        <BaseCardEvaluation
          libelleMoyenne="auto-évaluation"
          lien="TODO"
          moyenne={ficheEvaluation.criteres.moyenne}
          rattachement={formatterTitreEvaluation(ficheEvaluation.rattachement)}
          statutCompletion={
            ficheEvaluation.criteresValides ? "COMPLETER" : "NON_COMPLETE"
          }
          texteCompletion={formatterTexteCompletion({
            ...ficheEvaluation.criteres,
            estValide: ficheEvaluation.criteresValides,
          })}
          titre="Manière de servir"
        >
          <BarreProgressionEvaluation
            estValide={ficheEvaluation.criteresValides}
            nombreNotes={ficheEvaluation.criteres.nombreNotes}
            nombreTotal={ficheEvaluation.criteres.nombreTotal}
          />
        </BaseCardEvaluation>
      </div>
    </div>
  );
};
