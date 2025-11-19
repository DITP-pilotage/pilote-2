import { $Enums } from "@prisma/client";
import { clsxm } from "@/utils/clsxm";
import { CardEvaluation } from "./CardEvaluation";
import { BaseCardEvaluation } from "./BaseCardEvaluation";

type FicheEvaluation = {
  id: string;
  etapeCourante: $Enums.etape_evaluation_enum;
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

export const ListeAutoEvaluations = ({
  fichesEvaluation,
}: {
  fichesEvaluation: FicheEvaluation[];
}) => {
  return (
    <div className="space-y-8">
      {fichesEvaluation.map((ficheEvaluation) => (
        <div className="flex flex-column gap-2" key={ficheEvaluation.id}>
          <header>
            <h2 className="!text-2xl !text-primary !mb-0">
              {formatterTitreEvaluation(ficheEvaluation.rattachement)}
            </h2>
            <ul>
              <li className="!text-pilote-yellow">
                <b>Objectifs individuels</b> : vous avez auto-évalué 2
                objectif(s) sur 5
              </li>
              <li className="!text-pilote-yellow">
                <b>Manière de servir</b> : votre auto-évaluation est complète et
                en attente d'être transmise
              </li>
            </ul>
          </header>

          <div className="grid md:grid-cols-3 gap-4">
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

            <BaseCardEvaluation
              libelleMoyenne="auto-évaluation"
              lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}/objectifs`}
              moyenne={ficheEvaluation.objectifs.moyenne}
              rattachement={formatterTitreEvaluation(
                ficheEvaluation.rattachement,
              )}
              statutCompletion={
                ficheEvaluation.objectifs.nombreNotes !==
                ficheEvaluation.objectifs.nombreTotal
                  ? "NON_COMPLETE"
                  : "COMPLETER"
              }
              texteLienNavigation="accéder à l'auto-évaluation des objectifs"
              titre="Objectifs individuels"
            >
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  Progression : {ficheEvaluation.objectifs.nombreNotes}/
                  {ficheEvaluation.objectifs.nombreTotal} objectifs
                </div>
                {ficheEvaluation.objectifs.nombreTotal > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={clsxm("h-2 rounded-full", {
                        "bg-primary":
                          ficheEvaluation.objectifs.nombreNotes ===
                          ficheEvaluation.objectifs.nombreTotal,
                        "bg-pilote-yellow":
                          ficheEvaluation.objectifs.nombreNotes !==
                          ficheEvaluation.objectifs.nombreTotal,
                      })}
                      style={{
                        width: `${(ficheEvaluation.objectifs.nombreNotes / ficheEvaluation.objectifs.nombreTotal) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </BaseCardEvaluation>
            <BaseCardEvaluation
              libelleMoyenne="auto-évaluation"
              lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}/manieres-de-servir`}
              moyenne={ficheEvaluation.criteres.moyenne}
              rattachement={formatterTitreEvaluation(
                ficheEvaluation.rattachement,
              )}
              statutCompletion={
                ficheEvaluation.criteres.nombreNotes !==
                ficheEvaluation.criteres.nombreTotal
                  ? "NON_COMPLETE"
                  : "COMPLETER"
              }
              texteLienNavigation="accéder à l'auto-évaluation de la manière de servir"
              titre="Manière de servir"
            >
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  Progression : {ficheEvaluation.criteres.nombreNotes}/
                  {ficheEvaluation.criteres.nombreTotal} axes - à transmettre
                </div>
                {ficheEvaluation.criteres.nombreTotal > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={clsxm("h-2 rounded-full", {
                        "bg-primary":
                          ficheEvaluation.criteres.nombreNotes ===
                          ficheEvaluation.criteres.nombreTotal,
                        "bg-pilote-yellow":
                          ficheEvaluation.criteres.nombreNotes !==
                          ficheEvaluation.criteres.nombreTotal,
                      })}
                      style={{
                        width: `${(ficheEvaluation.criteres.nombreNotes / ficheEvaluation.criteres.nombreTotal) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </BaseCardEvaluation>
          </div>
        </div>
      ))}
    </div>
  );
};
