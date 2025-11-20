import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";
import { BaseCardEvaluation } from "@/components/Evaluation/ListeAutoEvaluation/BaseCardEvaluation";
import {
  formatterTexteCompletion,
  formatterTitreEvaluation,
} from "@/components/PageAppreciation/utilsTexteEvaluation";
import { BarreProgressionEvaluation } from "@/components/Evaluation/ListeAutoEvaluation/BarreProgressionEvaluation";
import { clsxm } from "@/utils/clsxm";

export const LigneCardEvaluationAppreciation = ({
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
            lien={`/evaluation/note-collective/${ficheEvaluation.rattachement.code}`}
            listeInformationsMoyennes={[
              {
                libelle: "taux d'avancement",
                moyenne: ficheEvaluation.noteCollective,
              },
            ]}
            texteBadge="Objectifs collectifs"
            texteLienNavigation="Consulter la liste des objectifs collectifs"
            titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
          >
            <div className="text-xs text-grey-200">
              Taux constaté dans PILOTE, en attente de la saisie finalisée des
              données par les ministères en charge des chantiers
            </div>
          </BaseCardEvaluation>
        ) : null}

        <BaseCardEvaluation
          lien="TODO"
          listeInformationsMoyennes={[
            {
              libelle: "appréciation",
              moyenne: ficheEvaluation.objectifs.moyenne,
            },
          ]}
          statutCompletion={
            ficheEvaluation.objectifsValides ? "COMPLETER" : "NON_COMPLETE"
          }
          texteBadge="Objectifs individuels"
          texteCompletion={formatterTexteCompletion({
            ...ficheEvaluation.objectifs,
            estValide: ficheEvaluation.objectifsValides,
          })}
          texteLienNavigation="accéder à l'appréciation des objectifs individuels"
          titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
        >
          <BarreProgressionEvaluation
            estValide={ficheEvaluation.objectifsValides}
            nombreNotes={ficheEvaluation.objectifs.nombreNotes}
            nombreTotal={ficheEvaluation.objectifs.nombreTotal}
            peutEtreTransmis={false}
          />
        </BaseCardEvaluation>
        <BaseCardEvaluation
          lien="TODO"
          listeInformationsMoyennes={[
            {
              libelle: "appréciation",
              moyenne: ficheEvaluation.criteres.moyenne,
            },
          ]}
          statutCompletion={
            ficheEvaluation.criteresValides ? "COMPLETER" : "NON_COMPLETE"
          }
          texteBadge="Manière de servir"
          texteCompletion={formatterTexteCompletion({
            ...ficheEvaluation.criteres,
            estValide: ficheEvaluation.criteresValides,
          })}
          texteLienNavigation="accéder à l'appréciation de la manière de servir"
          titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
        >
          <BarreProgressionEvaluation
            estValide={ficheEvaluation.criteresValides}
            nombreNotes={ficheEvaluation.criteres.nombreNotes}
            nombreTotal={ficheEvaluation.criteres.nombreTotal}
            peutEtreTransmis={false}
          />
        </BaseCardEvaluation>
      </div>
    </div>
  );
};
