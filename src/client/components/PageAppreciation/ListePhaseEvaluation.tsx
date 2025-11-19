import { Accordion } from "@/components/shared/Accordion";

export const ListePhaseEvaluation = () => {
  return (
    <div className="mx-auto w-full max-w-6xl mb-8">
      <Accordion.Root collapsible type="single">
        <Accordion.Item value="auto-evaluation">
          <Accordion.Header>
            <Accordion.Trigger>
              Territoire(s) en phase d'auto-évaluation
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <div className="space-y-3">
              <p>
                L'auto-évaluation est la première étape du processus
                d'évaluation des territoires. Elle permet aux préfets de
                renseigner leurs propres appréciations sur les objectifs
                collectifs et les axes de la manière de servir.
              </p>
              <p>
                Chaque territoire est invité à évaluer 4 à 5 objectifs
                collectifs ainsi que 3 axes sur la manière de servir. Cette
                phase se déroule de décembre 2025 à début février 2026.
              </p>
              <p className="font-medium">
                Les auto-évaluations servent de base pour la phase
                d'appréciation qui suit.
              </p>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="appreciation">
          <Accordion.Header>
            <Accordion.Trigger>
              Territoire(s) en phase d'appréciation
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <div className="space-y-3">
              <p>
                La phase d'appréciation vous permet de porter un regard sur les
                auto-évaluations transmises par vos territoires. Vous pouvez
                confirmer, ajuster ou commenter les notes proposées.
              </p>
              <p>
                Pour chaque item évalué, vous devez renseigner la note que vous
                retenez et, le cas échéant, un commentaire expliquant votre
                position si elle diffère de l'auto-évaluation.
              </p>
              <p>
                Cette phase est ouverte dès réception des auto-évaluations (au
                plus tard début février 2026) et se termine fin février 2026.
              </p>
              <p className="font-medium">
                Pensez à marquer les items comme traités au fur et à mesure pour
                suivre votre avancement.
              </p>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="instruction">
          <Accordion.Header>
            <Accordion.Trigger>
              Territoire(s) en phase d'instruction
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <div className="space-y-3">
              <p>
                L'instruction est la phase finale du processus d'évaluation,
                menée par la DITP (Direction interministérielle de la
                transformation publique).
              </p>
              <p>
                À l'issue de la phase d'appréciation, toutes les appréciations –
                même incomplètes – sont transmises à la DITP pour instruction.
                Cette phase permet d'analyser l'ensemble des évaluations et d'en
                tirer des enseignements au niveau national.
              </p>
              <p className="font-medium">
                Les résultats de l'instruction serviront à identifier les bonnes
                pratiques et les axes d'amélioration pour les politiques
                prioritaires du gouvernement.
              </p>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
};
