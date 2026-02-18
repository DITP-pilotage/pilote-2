import "@gouvfr/dsfr/dist/component/table/table.min.css";
import api from "@/server/infrastructure/api/trpc/api";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";
import { Accordion } from "@/components/shared/Accordion";
import { clsxm } from "@/utils/clsxm";

const formatterTypeValeur = (typeValeur: string): string => {
  switch (typeValeur) {
    case "VALEUR_AVANCEMENT":
      return "VA";
    case "VALEUR_INITIALE":
      return "VI";
    case "VALEUR_CIBLE":
      return "VC";
    default:
      return typeValeur;
  }
};

const RapportDetail = ({ rapportId }: { rapportId: string }) => {
  const [rapportDetail] = api.rapportHebdomadaire.récupérer.useSuspenseQuery({
    rapportId,
  });
  const [profils] = api.profil.récupérerTous.useSuspenseQuery();

  const profilParCode = new Map(
    profils.map((p: { code: string; nom: string }) => [p.code, p.nom]),
  );

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
        {PiloteDateFormatter.formatterDateSemaine(rapportDetail.periodeDebut)}{" "}
        au {PiloteDateFormatter.formatterDateSemaine(rapportDetail.periodeFin)}
      </h2>

      <section className="space-y-4">
        <h3 className="fr-h3 text-primary">Activité des comptes</h3>

        <Bloc contenuClassesSupplémentaires="!p-0">
          <h3 className="fr-text--lg fr-mb-0 p-4">Comptes créés</h3>
          {comptesCrees.length === 0 ? (
            <div className="p-8 border-t border-gray-200">
              <p className="fr-text--sm fr-mb-0">
                Aucun compte créé sur cette période.
              </p>
            </div>
          ) : (
            <div className="fr-table fr-mb-0 fr-pt-0">
              <table className="table">
                <thead className="bg-dsfr-blue-france-925">
                  <tr>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Profil</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {comptesCrees.map((compte) => (
                    <tr key={compte.email}>
                      <td>{compte.prenom}</td>
                      <td>{compte.nom}</td>
                      <td>{compte.email}</td>
                      <td>
                        {profilParCode.get(compte.profil) ?? compte.profil}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Bloc>

        <Bloc contenuClassesSupplémentaires="!p-0">
          <h3 className="fr-text--lg fr-mb-0 p-4">Comptes désactivés</h3>
          {comptesDesactives.length === 0 ? (
            <div className="p-8 border-t border-gray-200">
              <p className="fr-text--sm fr-mb-0">
                Aucun compte désactivé sur cette période.
              </p>
            </div>
          ) : (
            <div className="fr-table fr-mb-0 fr-pt-0">
              <table className="table">
                <thead className="bg-dsfr-blue-france-925">
                  <tr>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Profil</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {comptesDesactives.map((compte) => (
                    <tr key={compte.email}>
                      <td>{compte.prenom}</td>
                      <td>{compte.nom}</td>
                      <td>{compte.email}</td>
                      <td>
                        {profilParCode.get(compte.profil) ?? compte.profil}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Bloc>
      </section>

      <section className="space-y-4">
        <h3 className="fr-h3 text-primary">Suivi des chantiers</h3>

        {chantiers.length === 0 ? (
          <p className="fr-text--sm">
            Aucune activité sur les chantiers pour cette période.
          </p>
        ) : (
          chantiers.map((chantier) => (
            <Bloc contenuClassesSupplémentaires="!p-0" key={chantier.id}>
              <div className="p-4 flex items-baseline gap-3">
                <h3 className="fr-text--lg fr-mb-0">
                  {chantier.id} - {chantier.nom}
                </h3>
                <a
                  className="fr-link fr-text--sm"
                  href={`/chantier/${chantier.id}/${territoireCode}`}
                >
                  Voir le chantier
                </a>
              </div>
              <Accordion.Root type="multiple">
                {chantier.indicateurs.map((indicateur) => (
                  <Accordion.Item
                    value={indicateur.id}
                    key={indicateur.id}
                    className="border-b-0 group border-t border-t-gray-200"
                  >
                    <Accordion.Header
                      className={clsxm(
                        "group-odd:!bg-transparent group-even:!bg-dsfr-contrast-grey/30 border-t-0",
                      )}
                    >
                      <Accordion.Trigger className="!bg-transparent hover:!bg-transparent !pl-8">
                        {indicateur.id} - {indicateur.nom}
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="!bg-transparent !px-0 !pb-0 !pt-0">
                      <div className="fr-table fr-mb-0 fr-pt-0">
                        <table className="table">
                          <thead className="bg-dsfr-blue-france-925">
                            <tr>
                              <th>Territoire</th>
                              <th>Type de valeur</th>
                              <th>Valeur</th>
                              <th>Date de valeur</th>
                              <th>Date d'événement</th>
                            </tr>
                          </thead>
                          <tbody className="bg-transparent">
                            {indicateur.territoires.map((territoire) => (
                              <tr
                                key={`${territoire.code}-${territoire.typeValeur}-${territoire.dateValeur}`}
                              >
                                <td>{territoire.nom}</td>
                                <td>
                                  {formatterTypeValeur(territoire.typeValeur)}
                                </td>
                                <td>{territoire.valeur ?? "—"}</td>
                                <td>
                                  {PiloteDateFormatter.isoDateFranceMetropolitaine(
                                    territoire.dateValeur,
                                  )}
                                </td>
                                <td>
                                  {PiloteDateFormatter.isoDateFranceMetropolitaine(
                                    territoire.dateEvenement,
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </Bloc>
          ))
        )}
      </section>
    </div>
  );
};

export default RapportDetail;
