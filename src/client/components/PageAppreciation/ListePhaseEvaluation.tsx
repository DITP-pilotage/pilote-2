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
            <h2 className="!text-2xl !text-primary">
              {`${groupe} - Vue détaillée des ${
                AUTO_EVALUATION.length +
                CONSOLIDATION.length +
                INSTRUCTION.length
              } formulaires`}
            </h2>
            <ul className="list-disc list-inside mt-4 mb-2">
              {(() => {
                const appreciationRequierentAttention = CONSOLIDATION.filter(
                  (fiche) => !fiche.objectifsValides || !fiche.criteresValides,
                ).length;
                const appreciationCompletes = CONSOLIDATION.filter(
                  (fiche) => fiche.objectifsValides && fiche.criteresValides,
                ).length;
                const autoEvaluationEnCours = AUTO_EVALUATION.length;
                const instructionEnCours = INSTRUCTION.length;

                return (
                  <>
                    {appreciationRequierentAttention > 0 && (
                      <li className="!text-pilote-yellow">
                        <b>Phase d'appréciation</b> :{" "}
                        {appreciationRequierentAttention} formulaire(s){" "}
                        {appreciationRequierentAttention === 1
                          ? "requiert"
                          : "requièrent"}{" "}
                        votre attention
                      </li>
                    )}
                    {appreciationCompletes > 0 && (
                      <li className="!text-primary">
                        <b>Phase d'appréciation</b> : {appreciationCompletes}{" "}
                        formulaire(s){" "}
                        {appreciationCompletes === 1
                          ? "est complété"
                          : "sont complétés"}{" "}
                        et/ou en train d'être vérifié
                        {appreciationCompletes === 1 ? "" : "s"} par la DITP
                      </li>
                    )}
                    {autoEvaluationEnCours > 0 && (
                      <li className="!text-grey-200">
                        <b>Phase d'auto-évaluation</b> : {autoEvaluationEnCours}{" "}
                        formulaire(s){" "}
                        {autoEvaluationEnCours === 1 ? "est" : "sont"} en cours
                        d'auto-évaluation
                      </li>
                    )}
                    {instructionEnCours > 0 && (
                      <li className="!text-grey-200">
                        <b>Phase d'instruction</b> : {instructionEnCours}{" "}
                        formulaire(s){" "}
                        {instructionEnCours === 1 ? "est passé" : "sont passés"}{" "}
                        en instruction
                      </li>
                    )}
                  </>
                );
              })()}
            </ul>
            <Accordion.Root type="multiple">
              <Accordion.Item value="appreciation">
                <Accordion.Header>
                  <Accordion.Trigger>
                    Territoire(s) en phase d'appréciation - 
                    {CONSOLIDATION.length} formulaire(s) en cours
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
                    {AUTO_EVALUATION.length} formulaire(s) en cours
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
                    Territoire(s) en phase d'instruction - {INSTRUCTION.length}{" "}
                    formulaire(s) en cours
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
