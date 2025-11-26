import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";
import { BaseCardEvaluation } from "@/components/Evaluation/ListeAutoEvaluation/BaseCardEvaluation";
import {
  formatterTexteCompletion,
  formatterTitreEvaluation,
} from "@/components/PageAppreciation/utilsTexteEvaluation";
import { BarreProgressionEvaluation } from "@/components/_commons/BarreProgressionEvaluation";
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
            texteLienNavigation="consulter la liste des objectifs collectifs"
            titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
          >
            <div className="text-xs text-grey-200">
              Taux constaté dans PILOTE, en attente de la saisie finalisée des
              données par les ministères en charge des chantiers
            </div>
          </BaseCardEvaluation>
        ) : null}

        <BaseCardEvaluation
          lien={`/evaluation/appreciation/espace-appreciation?territoire=${ficheEvaluation.rattachement.code}&categorie=objectif`}
          listeInformationsMoyennes={[
            {
              libelle: "appréciation",
              misEnAvant: true,
              moyenne:
                ficheEvaluation.objectifs.moyennesParPhase.CONSOLIDATION ||
                null,
            },
            {
              libelle: "auto-évaluation",
              moyenne:
                ficheEvaluation.objectifs.moyennesParPhase.AUTO_EVALUATION ||
                null,
            },
          ]}
          statutCompletion={
            ficheEvaluation.readOnly || ficheEvaluation.isObjectifsValides
              ? "COMPLETER"
              : "NON_COMPLETE"
          }
          texteBadge="Objectifs individuels"
          texteCompletion={formatterTexteCompletion({
            estValide:
              ficheEvaluation.isObjectifsValides || ficheEvaluation.readOnly,
          })}
          texteLienNavigation="accéder à l'appréciation des objectifs individuels"
          titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
        >
          <BarreProgressionEvaluation
            elementDeProgression="objectifs"
            estValide={
              ficheEvaluation.isObjectifsValides || ficheEvaluation.readOnly
            }
            estVerrouille={ficheEvaluation.readOnly}
            nombreNotes={ficheEvaluation.objectifs.nombreTraites}
            nombreTotal={ficheEvaluation.objectifs.nombreTotal}
            peutEtreTransmis={false}
            texteProgression="Traité"
          />
        </BaseCardEvaluation>
        <BaseCardEvaluation
          lien={`/evaluation/appreciation/espace-appreciation?territoire=${ficheEvaluation.rattachement.code}&categorie=critere`}
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
          statutCompletion={
            ficheEvaluation.readOnly || ficheEvaluation.isCriteresValides
              ? "COMPLETER"
              : "NON_COMPLETE"
          }
          texteBadge="Manière de servir"
          texteCompletion={formatterTexteCompletion({
            estValide:
              ficheEvaluation.isCriteresValides || ficheEvaluation.readOnly,
          })}
          texteLienNavigation="accéder à l'appréciation de la manière de servir"
          titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
        >
          <BarreProgressionEvaluation
            elementDeProgression="axes"
            estValide={
              ficheEvaluation.isCriteresValides || ficheEvaluation.readOnly
            }
            estVerrouille={ficheEvaluation.readOnly}
            nombreNotes={ficheEvaluation.criteres.nombreTraites}
            nombreTotal={ficheEvaluation.criteres.nombreTotal}
            peutEtreTransmis={false}
            texteProgression="Traité"
          />
        </BaseCardEvaluation>
      </div>
    </div>
  );
};
