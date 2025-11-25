import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";
import { BaseCardEvaluation } from "@/components/Evaluation/ListeAutoEvaluation/BaseCardEvaluation";
import { formatterTitreEvaluation } from "@/components/PageAppreciation/utilsTexteEvaluation";
import { clsxm } from "@/utils/clsxm";

export const LigneCardEvaluationInstruction = ({
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
                misEnAvant: true,
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
              misEnAvant: true,
              moyenne:
                ficheEvaluation.criteres.moyennesParPhase.CONSOLIDATION || null,
            },
            {
              libelle: "auto-évaluation",
              moyenne:
                ficheEvaluation.criteres.moyennesParPhase.AUTO_EVALUATION ||
                null,
            },
          ]}
          texteBadge="Objectifs individuels"
          texteLienNavigation="consulter l'appréciation des objectifs individuels"
          titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
        />
        <BaseCardEvaluation
          lien="TODO"
          listeInformationsMoyennes={[
            {
              libelle: "appréciation",
              misEnAvant: true,
              moyenne:
                ficheEvaluation.criteres.moyennesParPhase.CONSOLIDATION || null,
            },
            {
              libelle: "auto-évaluation",
              moyenne:
                ficheEvaluation.criteres.moyennesParPhase.AUTO_EVALUATION ||
                null,
            },
          ]}
          texteBadge="Manière de servir"
          texteLienNavigation="consulter l'appréciation de la manière de servir"
          titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
        />
      </div>
    </div>
  );
};
