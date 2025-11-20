import { useState } from "react";
import { Accordion } from "@/components/shared/Accordion";
import { pageAppreciation } from "@/components/PageAppreciation/PageAppreciationServerSideContext";
import { LigneCardEvaluationAutoEvaluation } from "@/components/PageAppreciation/LigneCardEvaluationAutoEvaluation";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { EyeOffIcon } from "@/components/_commons/Icones/EyeOffIcon";
import { EyeIcon } from "@/components/_commons/Icones/EyeIcon";
import { Icone } from "@/components/_commons/Icone";

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
            <Accordion.Root collapsible type="single">
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
                  ) : null}
                </Accordion.Content>
              </Accordion.Item>
              <Accordion.Item value="appreciation">
                <Accordion.Header>
                  <Accordion.Trigger>
                    Territoire(s) en phase d'appréciation - 
                    {CONSOLIDATION.length} formulaire(s) en cours
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  {CONSOLIDATION.length > 0 ? (
                    <div className="space-y-3">
                      <p>
                        La phase d'appréciation vous permet de porter un regard
                        sur les auto-évaluations transmises par vos territoires.
                        Vous pouvez confirmer, ajuster ou commenter les notes
                        proposées.
                      </p>
                      <p>
                        Pour chaque item évalué, vous devez renseigner la note
                        que vous retenez et, le cas échéant, un commentaire
                        expliquant votre position si elle diffère de
                        l'auto-évaluation.
                      </p>
                      <p>
                        Cette phase est ouverte dès réception des
                        auto-évaluations (au plus tard début février 2026) et se
                        termine fin février 2026.
                      </p>
                      <p className="font-medium">
                        Pensez à marquer les items comme traités au fur et à
                        mesure pour suivre votre avancement.
                      </p>
                    </div>
                  ) : null}
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
                    <div className="space-y-3">
                      <p>
                        L'instruction est la phase finale du processus
                        d'évaluation, menée par la DITP (Direction
                        interministérielle de la transformation publique).
                      </p>
                      <p>
                        À l'issue de la phase d'appréciation, toutes les
                        appréciations – même incomplètes – sont transmises à la
                        DITP pour instruction. Cette phase permet d'analyser
                        l'ensemble des évaluations et d'en tirer des
                        enseignements au niveau national.
                      </p>
                      <p className="font-medium">
                        Les résultats de l'instruction serviront à identifier
                        les bonnes pratiques et les axes d'amélioration pour les
                        politiques prioritaires du gouvernement.
                      </p>
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
