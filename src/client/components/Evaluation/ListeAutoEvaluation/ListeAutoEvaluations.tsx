import { $Enums } from "@prisma/client";
import { LigneEnteteAvancementCompletionEvaluation } from "@/components/Evaluation/ListeAutoEvaluation/LigneEnteteAvancementCompletionEvaluation";
import { BarreProgressionEvaluation } from "@/components/_commons/BarreProgressionEvaluation";
import { BaseCardEvaluation } from "./BaseCardEvaluation";

type FicheEvaluation = {
  id: string;
  etapeCourante: $Enums.etape_evaluation_enum;
  objectifsValides: boolean;
  criteresValides: boolean;
  rattachement: {
    code: string;
    libelle: string;
  };
  objectifs: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
  criteres: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
  noteCollective: number | null;
};

const formatterTitreEvaluation = ({
  code,
  libelle,
}: {
  code: string;
  libelle: string;
}) => {
  if (code.startsWith("DEPT")) {
    return `${code.split("-")[1]} - ${libelle}`;
  }

  if (code.startsWith("REG")) {
    return `Région ${libelle}`;
  }
  return libelle;
};

const formatterTexteCompletion = ({
  nombreNotes,
  nombreTotal,
  estValide,
}: {
  nombreNotes: number;
  nombreTotal: number;
  estValide: boolean;
}) => {
  return estValide
    ? "TRANSMIS"
    : nombreNotes === nombreTotal
      ? "À TRANSMETTRE"
      : "À COMPLÉTER";
};

export const ListeAutoEvaluations = ({
  fichesEvaluation,
}: {
  fichesEvaluation: FicheEvaluation[];
}) => {
  return (
    <div className="space-y-8">
      {fichesEvaluation.map((ficheEvaluation) => {
        const criteresValidesOuEtapeClose =
          ficheEvaluation.criteresValides ||
          ficheEvaluation.etapeCourante !== "AUTO_EVALUATION";
        const ObjectifsValidesOuEtapeClose =
          ficheEvaluation.objectifsValides ||
          ficheEvaluation.etapeCourante !== "AUTO_EVALUATION";
        return (
          <div className="flex flex-col gap-2" key={ficheEvaluation.id}>
            <header>
              <h2 className="!text-2xl !text-primary !mb-0">
                {formatterTitreEvaluation(ficheEvaluation.rattachement)}
              </h2>
              <ul>
                <LigneEnteteAvancementCompletionEvaluation
                  avancementCompletion={ficheEvaluation.objectifs}
                  categorie="Objectifs individuels"
                  estValide={ObjectifsValidesOuEtapeClose}
                  texteCibleCompletion="objectif"
                />
                <LigneEnteteAvancementCompletionEvaluation
                  avancementCompletion={ficheEvaluation.criteres}
                  categorie="Manière de servir"
                  estValide={criteresValidesOuEtapeClose}
                  texteCibleCompletion="axe"
                />
              </ul>
            </header>

            <div className="grid md:grid-cols-3 gap-4">
              <BaseCardEvaluation
                lien={`/evaluation/note-collective/${ficheEvaluation.rattachement.code}`}
                listeInformationsMoyennes={[
                  {
                    libelle: "taux d'avancement",
                    misEnAvant: true,
                    moyenne: ficheEvaluation.noteCollective,
                  },
                ]}
                texteBadge={formatterTitreEvaluation(
                  ficheEvaluation.rattachement,
                )}
                texteLienNavigation="Consulter la liste des objectifs collectifs"
                titre="Objectifs collectifs"
              >
                <div className="text-xs text-grey-200">
                  Taux constaté dans PILOTE, en attente de la saisie finalisée
                  des données par les ministères en charge des chantiers
                </div>
              </BaseCardEvaluation>

              <BaseCardEvaluation
                lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}/objectifs`}
                listeInformationsMoyennes={[
                  {
                    libelle: "auto-évaluation",
                    misEnAvant: true,
                    moyenne: ficheEvaluation.objectifs.moyenne,
                  },
                ]}
                statutCompletion={
                  ObjectifsValidesOuEtapeClose ? "COMPLETER" : "NON_COMPLETE"
                }
                texteBadge={formatterTitreEvaluation(
                  ficheEvaluation.rattachement,
                )}
                texteCompletion={formatterTexteCompletion({
                  ...ficheEvaluation.objectifs,
                  estValide: ObjectifsValidesOuEtapeClose,
                })}
                texteLienNavigation="accéder à l'auto-évaluation des objectifs"
                titre="Objectifs individuels"
              >
                <BarreProgressionEvaluation
                  elementDeProgression="objectifs"
                  estValide={ObjectifsValidesOuEtapeClose}
                  nombreNotes={ficheEvaluation.objectifs.nombreNotes}
                  nombreTotal={ficheEvaluation.objectifs.nombreTotal}
                />
              </BaseCardEvaluation>
              <BaseCardEvaluation
                lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}/manieres-de-servir`}
                listeInformationsMoyennes={[
                  {
                    libelle: "auto-évaluation",
                    misEnAvant: true,
                    moyenne: ficheEvaluation.criteres.moyenne,
                  },
                ]}
                statutCompletion={
                  criteresValidesOuEtapeClose ? "COMPLETER" : "NON_COMPLETE"
                }
                texteBadge={formatterTitreEvaluation(
                  ficheEvaluation.rattachement,
                )}
                texteCompletion={formatterTexteCompletion({
                  ...ficheEvaluation.criteres,
                  estValide: criteresValidesOuEtapeClose,
                })}
                texteLienNavigation="accéder à l'auto-évaluation de la manière de servir"
                titre="Manière de servir"
              >
                <BarreProgressionEvaluation
                  elementDeProgression="axes"
                  estValide={criteresValidesOuEtapeClose}
                  nombreNotes={ficheEvaluation.criteres.nombreNotes}
                  nombreTotal={ficheEvaluation.criteres.nombreTotal}
                />
              </BaseCardEvaluation>
            </div>
          </div>
        );
      })}
    </div>
  );
};
