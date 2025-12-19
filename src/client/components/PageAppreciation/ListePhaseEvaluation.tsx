import { useState } from "react";
import { Accordion } from "@/components/shared/Accordion";
import { pageAppreciation } from "@/components/PageAppreciation/PageAppreciationServerSideContext";
import { LigneCardEvaluationAutoEvaluation } from "@/components/PageAppreciation/LigneCardEvaluationAutoEvaluation";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { EyeOffIcon } from "@/components/_commons/Icones/EyeOffIcon";
import { EyeIcon } from "@/components/_commons/Icones/EyeIcon";
import { Icone } from "@/components/_commons/Icone";
import { LigneCardEvaluationAppreciation } from "@/components/PageAppreciation/LigneCardEvaluationAppreciation";
import { LigneCardEvaluationInstruction } from "@/components/PageAppreciation/LigneCardEvaluationInstruction";
import { LignesEnteteAvancementCompletionAppreciation } from "@/components/PageAppreciation/LignesEnteteAvancementCompletionAppreciation";

export const ListePhaseEvaluation = () => {
  const { fichesParGroupePuisPhase } =
    pageAppreciation.useServerSidePropsContext();
  const [afficherObjectifsCollectifs, setAfficherObjectifsCollectifs] =
    useState<boolean>(false);
  return (
    <div className="mx-auto w-full max-w-6xl mb-8">
      {Object.entries(fichesParGroupePuisPhase).map(([groupe, phases]) => {
        const { AUTO_EVALUATION, CONSOLIDATION, INSTRUCTION } = phases;
        return (
          <div className="mb-8" key={groupe}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="!text-2xl !text-primary !mb-0">
                {`Synthèse des appréciations pour la région et les départements de : ${groupe}`}
              </h2>
            </div>

            <p className="!mb-1">
              Vous trouverez ci-dessous une synthèse des résultats retenus sur
              chacune des composantes et l'avancement de vos appréciations.
            </p>

            <p className="!mb-1">
              Les tuiles "Objectifs individuels” (respectivement "Manière de
              servir”) vous donnent accès à votre espace d'appréciation filtré :
            </p>

            <ul className="!mt-0 !mb-4">
              <li>
                sur les objectifs individuels (respectivement sur les axes de la
                manière de servir)
              </li>
              <li>pour le territoire concerné.</li>
            </ul>

            <LignesEnteteAvancementCompletionAppreciation
              appreciation={CONSOLIDATION}
              autoEvaluation={AUTO_EVALUATION}
              instruction={INSTRUCTION}
            />
            <Accordion.Root className="flex flex-col gap-6" type="multiple">
              <Accordion.Item value="appreciation">
                <Accordion.Header>
                  <Accordion.Trigger>
                    Territoire(s) en phase d'appréciation - 
                    {CONSOLIDATION.length * 2} formulaire(s) en cours
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  {CONSOLIDATION.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <div>
                        <Bouton
                          className="!text-xs"
                          iconLeft={
                            <Icone
                              className="w-4 h-4"
                              icone={
                                afficherObjectifsCollectifs
                                  ? EyeOffIcon
                                  : EyeIcon
                              }
                            />
                          }
                          label={
                            afficherObjectifsCollectifs
                              ? "Masquer les objectifs collectifs"
                              : "Afficher les objectifs collectifs"
                          }
                          onClick={() =>
                            setAfficherObjectifsCollectifs(
                              !afficherObjectifsCollectifs,
                            )
                          }
                          variant="link"
                        />
                      </div>
                      {CONSOLIDATION.map((ficheEvaluation) => (
                        <LigneCardEvaluationAppreciation
                          afficherObjectifsCollectifs={
                            afficherObjectifsCollectifs
                          }
                          ficheEvaluation={ficheEvaluation}
                          key={ficheEvaluation.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <span>Aucun territoire n'est dans cette phase</span>
                  )}
                </Accordion.Content>
              </Accordion.Item>
              {AUTO_EVALUATION.length > 0 ? (
                <Accordion.Item value="auto-evaluation">
                  <Accordion.Header>
                    <Accordion.Trigger>
                      Territoire(s) en phase d'auto-évaluation - 
                      {AUTO_EVALUATION.length * 2} formulaire(s) en cours
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content>
                    <div className="flex flex-col gap-4">
                      <div>
                        <Bouton
                          className="!text-xs"
                          iconLeft={
                            <Icone
                              className="w-4 h-4"
                              icone={
                                afficherObjectifsCollectifs
                                  ? EyeOffIcon
                                  : EyeIcon
                              }
                            />
                          }
                          label={
                            afficherObjectifsCollectifs
                              ? "Masquer les objectifs collectifs"
                              : "Afficher les objectifs collectifs"
                          }
                          onClick={() =>
                            setAfficherObjectifsCollectifs(
                              !afficherObjectifsCollectifs,
                            )
                          }
                          variant="link"
                        />
                      </div>
                      {AUTO_EVALUATION.map((ficheEvaluation) => (
                        <LigneCardEvaluationAutoEvaluation
                          afficherObjectifsCollectifs={
                            afficherObjectifsCollectifs
                          }
                          ficheEvaluation={ficheEvaluation}
                          key={ficheEvaluation.id}
                        />
                      ))}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ) : null}
              <Accordion.Item value="instruction">
                <Accordion.Header>
                  <Accordion.Trigger>
                    Territoire(s) en phase d'instruction -{" "}
                    {INSTRUCTION.length * 2} formulaire(s) en cours
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  {INSTRUCTION.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <div>
                        <Bouton
                          className="!text-xs"
                          iconLeft={
                            <Icone
                              className="w-4 h-4"
                              icone={
                                afficherObjectifsCollectifs
                                  ? EyeOffIcon
                                  : EyeIcon
                              }
                            />
                          }
                          label={
                            afficherObjectifsCollectifs
                              ? "Masquer les objectifs collectifs"
                              : "Afficher les objectifs collectifs"
                          }
                          onClick={() =>
                            setAfficherObjectifsCollectifs(
                              !afficherObjectifsCollectifs,
                            )
                          }
                          variant="link"
                        />
                      </div>
                      {INSTRUCTION.map((ficheEvaluation) => (
                        <LigneCardEvaluationInstruction
                          afficherObjectifsCollectifs={
                            afficherObjectifsCollectifs
                          }
                          ficheEvaluation={ficheEvaluation}
                          key={ficheEvaluation.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <span>Aucun territoire n'est dans cette phase</span>
                  )}
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          </div>
        );
      })}
    </div>
  );
};
