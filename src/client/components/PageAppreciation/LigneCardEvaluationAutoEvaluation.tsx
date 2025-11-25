import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";
import { BaseCardEvaluation } from "@/components/Evaluation/ListeAutoEvaluation/BaseCardEvaluation";
import { formatterTitreEvaluation } from "@/components/PageAppreciation/utilsTexteEvaluation";
import { BarreProgressionEvaluation } from "@/components/_commons/BarreProgressionEvaluation";
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
            lien={`/evaluation/note-collective/${ficheEvaluation.rattachement.code}`}
            listeInformationsMoyennes={[
              {
                libelle: "taux d'avancement",
                moyenne: ficheEvaluation.noteCollective,
                misEnAvant: true,
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
          listeInformationsMoyennes={[]}
          statutCompletion={
            ficheEvaluation.isObjectifsValides ? "COMPLETER" : "NON_COMPLETE"
          }
          texteBadge="Objectifs individuels"
          titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
        >
          <BarreProgressionEvaluation
            elementDeProgression="objectifs"
            estValide={ficheEvaluation.isObjectifsValides}
            nombreNotes={ficheEvaluation.objectifs.nombreNotes}
            nombreTotal={ficheEvaluation.objectifs.nombreTotal}
            peutEtreTransmis={false}
          />
        </BaseCardEvaluation>
        <BaseCardEvaluation
          listeInformationsMoyennes={[]}
          statutCompletion={
            ficheEvaluation.isCriteresValides ? "COMPLETER" : "NON_COMPLETE"
          }
          texteBadge="Manière de servir"
          titre={formatterTitreEvaluation(ficheEvaluation.rattachement)}
        >
          <BarreProgressionEvaluation
            elementDeProgression="axes"
            estValide={ficheEvaluation.isCriteresValides}
            nombreNotes={ficheEvaluation.criteres.nombreNotes}
            nombreTotal={ficheEvaluation.criteres.nombreTotal}
            peutEtreTransmis={false}
          />
        </BaseCardEvaluation>
      </div>
    </div>
  );
};
