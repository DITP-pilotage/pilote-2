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
import { ModaleTransmissionDITP } from "@/components/PageAppreciation/ModaleVerrouillageConsolidation/ModaleVerrouillageConsolidation";

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
                {`${groupe} - Vue détaillée des ${
                  (AUTO_EVALUATION.length +
                    CONSOLIDATION.length +
                    INSTRUCTION.length) *
                  2
                } formulaires`}
              </h2>
              <ModaleTransmissionDITP
                fichesConsolidation={CONSOLIDATION}
                groupe={groupe}
              >
                <button className="fr-btn fr-btn--secondary" type="button">
                  Transmettre à la DITP
                </button>
              </ModaleTransmissionDITP>
            </div>
            <LignesEnteteAvancementCompletionAppreciation
              appreciation={CONSOLIDATION}
              autoEvaluation={AUTO_EVALUATION}
              instruction={INSTRUCTION}
            />
            <Accordion.Root type="multiple">
              <Accordion.Item value="appreciation">
                <Accordion.Header>
                  <Accordion.Trigger>
                    Territoire(s) en phase d'appréciation - 
                    {CONSOLIDATION.length * 2} formulaire(s) en cours
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  {CONSOLIDATION.length > 0 ? (
                    <div className="flex flex-col gap-4 mt-4">
                      <div>
                        <Bouton
                          iconLeft={
                            <Icone
                              className="w-6 h-6"
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
                    <div className="mt-4 mb-2">
                      Aucun territoire n'est dans cette phase
                    </div>
                  )}
                </Accordion.Content>
              </Accordion.Item>
              <Accordion.Item value="auto-evaluation">
                <Accordion.Header>
                  <Accordion.Trigger>
                    Territoire(s) en phase d'auto-évaluation - 
                    {AUTO_EVALUATION.length * 2} formulaire(s) en cours
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  {AUTO_EVALUATION.length > 0 ? (
                    <div className="flex flex-col gap-4 mt-4">
                      <div>
                        <Bouton
                          iconLeft={
                            <Icone
                              className="w-6 h-6"
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
                  ) : (
                    <div className="mt-4 mb-2">
                      Aucun territoire n'est dans cette phase
                    </div>
                  )}
                </Accordion.Content>
              </Accordion.Item>
              <Accordion.Item value="instruction">
                <Accordion.Header>
                  <Accordion.Trigger>
                    Territoire(s) en phase d'instruction -{" "}
                    {INSTRUCTION.length * 2} formulaire(s) en cours
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  {INSTRUCTION.length > 0 ? (
                    <div className="flex flex-col gap-4 mt-4">
                      <div>
                        <Bouton
                          iconLeft={
                            <Icone
                              className="w-6 h-6"
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
                    <div className="mt-4 mb-2">
                      Aucun territoire n'est dans cette phase
                    </div>
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
