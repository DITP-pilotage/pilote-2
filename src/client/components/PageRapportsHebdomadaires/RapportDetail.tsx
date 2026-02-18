import api from "@/server/infrastructure/api/trpc/api";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";
import { TitreSection } from "./TitreSection";
import { BlocEtatVide } from "./BlocEtatVide";
import { TableauUtilisateurs } from "./TableauUtilisateurs";
import { BlocChantier } from "./BlocChantier";

const RapportDetail = ({ rapportId }: { rapportId: string }) => {
  const [rapportDetail] = api.rapportHebdomadaire.récupérer.useSuspenseQuery({
    rapportId,
  });

  const comptesCrees =
    rapportDetail.contenuRapport.sectionActiviteComptes.comptesCrees;
  const comptesDesactives =
    rapportDetail.contenuRapport.sectionActiviteComptes.comptesDesactives;
  const chantiers = rapportDetail.contenuRapport.sectionActiviteChantiers;
  const territoireCode =
    rapportDetail.contenuRapport.coordinateur.territoires[0]?.code || "NAT-FR";

  return (
    <div className="space-y-10 my-10">
      <h2 className="fr-h2 text-primary">
        Semaine du{" "}
        {PiloteDateFormatter.dateFrancaiseLongue(rapportDetail.periodeDebut)} au{" "}
        {PiloteDateFormatter.dateFrancaiseLongue(rapportDetail.periodeFin)}
      </h2>

      <section className="space-y-4">
        <TitreSection>Activité des comptes</TitreSection>

        <Bloc contenuClassesSupplémentaires="fr-p-0">
          <h3 className="fr-text--lg fr-mb-0 p-4">Comptes créés</h3>
          {comptesCrees.length === 0 ? (
            <BlocEtatVide>Aucun compte créé sur cette période.</BlocEtatVide>
          ) : (
            <TableauUtilisateurs comptes={comptesCrees} />
          )}
        </Bloc>

        <Bloc contenuClassesSupplémentaires="fr-p-0">
          <h3 className="fr-text--lg fr-mb-0 p-4">Comptes désactivés</h3>
          {comptesDesactives.length === 0 ? (
            <BlocEtatVide>
              Aucun compte désactivé sur cette période.
            </BlocEtatVide>
          ) : (
            <TableauUtilisateurs comptes={comptesDesactives} />
          )}
        </Bloc>
      </section>

      <section className="space-y-4">
        <TitreSection>Suivi des chantiers</TitreSection>

        {chantiers.length === 0 ? (
          <p className="fr-text--sm">
            Aucune activité sur les chantiers pour cette période.
          </p>
        ) : (
          chantiers.map((chantier) => (
            <BlocChantier
              key={chantier.id}
              chantier={chantier}
              territoireCode={territoireCode}
            />
          ))
        )}
      </section>
    </div>
  );
};

export { RapportDetail };
