import "@gouvfr/dsfr/dist/component/table/table.min.css";
import "@gouvfr/dsfr/dist/component/accordion/accordion.min.css";
import api from "@/server/infrastructure/api/trpc/api";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";

const formatterDateSemaine = (date: Date): string => {
  const d = new Date(date);
  const jour = d.getDate();
  const jourFormaté = jour === 1 ? "1er" : String(jour);
  const mois = d.toLocaleDateString("fr-FR", { month: "long" });
  return `${jourFormaté} ${mois} ${d.getFullYear()}`;
};

const formatterProfil = (profil: string): string => {
  switch (profil) {
    case "COORDINATEUR_REGION":
      return "Coordinateur PILOTE régional";
    case "COORDINATEUR_DEPARTEMENT":
      return "Coordinateur PILOTE départemental";
    case "CABINET_MTFP":
      return "Cabinet MTFP";
    case "PM_ET_CABINET":
      return "Première Ministre et cabinet";
    case "PR":
      return "Présidence de la République";
    case "CABINET_MINISTERIEL":
      return "Cabinets ministériels";
    case "DIR_ADMIN_CENTRALE":
      return "Direction d'administration centrale";
    case "DROM":
      return "DROM/Outre-Mer";
    case "PREFET_DEPARTEMENT":
      return "Préfet de département et collaborateurs";
    case "PREFET_REGION":
      return "Préfet de région et collaborateurs";
    case "RESPONSABLE_DEPARTEMENT":
      return "Responsable local départemental";
    case "RESPONSABLE_REGION":
      return "Responsable local régional";
    case "SERVICES_DECONCENTRES_DEPARTEMENT":
      return "Services déconcentrés départementaux";
    case "SERVICES_DECONCENTRES_REGION":
      return "Services déconcentrés régionaux";
    case "SECRETARIAT_GENERAL":
      return "Secrétariat général de ministère";
    case "DIR_PROJET":
      return "Directeur de projet";
    case "EQUIPE_DIR_PROJET":
      return "Équipe de Directeur de projet";
    case "DITP_ADMIN":
      return "DITP - Admin";
    case "DITP_PILOTAGE":
      return "DITP - Pilotage";
    default:
      return profil;
  }
};

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

  const comptesCrees =
    rapportDetail.contenuRapport.sectionActiviteComptes.comptesCrees;
  const comptesDesactives =
    rapportDetail.contenuRapport.sectionActiviteComptes.comptesDesactives;
  const chantiers = rapportDetail.contenuRapport.sectionActiviteChantiers;
  const territoireCode =
    rapportDetail.contenuRapport.coordinateur.territoires[0]?.code || "NAT-FR";

  return (
    <div className="fr-p-4w">
      <h2 className="fr-h2">
        Semaine du {formatterDateSemaine(rapportDetail.periodeDebut)} au{" "}
        {formatterDateSemaine(rapportDetail.periodeFin)}
      </h2>

      <Bloc
        backgroundClassNameTitre="bg-dsfr-blue-france-925"
        contenuClassesSupplémentaires="!p-0"
        titre="Comptes créés"
      >
        {comptesCrees.length === 0 ? (
          <div className="fr-p-4w">
            <p className="fr-text--sm">Aucun compte créé sur cette période.</p>
          </div>
        ) : (
          <div className="fr-table">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Profil</th>
                </tr>
              </thead>
              <tbody>
                {comptesCrees.map((compte) => (
                  <tr key={compte.email}>
                    <td>{compte.nom}</td>
                    <td>{compte.prenom}</td>
                    <td>{compte.email}</td>
                    <td>{formatterProfil(compte.profil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloc>

      <Bloc
        backgroundClassNameTitre="bg-dsfr-blue-france-925"
        contenuClassesSupplémentaires="!p-0"
        titre="Comptes désactivés"
      >
        {comptesDesactives.length === 0 ? (
          <div className="fr-p-4w">
            <p className="fr-text--sm">
              Aucun compte désactivé sur cette période.
            </p>
          </div>
        ) : (
          <div className="fr-table">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Profil</th>
                </tr>
              </thead>
              <tbody>
                {comptesDesactives.map((compte) => (
                  <tr key={compte.email}>
                    <td>{compte.nom}</td>
                    <td>{compte.prenom}</td>
                    <td>{compte.email}</td>
                    <td>{formatterProfil(compte.profil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloc>

      <h3 className="fr-h3 fr-mt-4w">Activité des chantiers</h3>
      {chantiers.length === 0 ? (
        <p className="fr-text--sm">
          Aucune activité sur les chantiers pour cette période.
        </p>
      ) : (
        chantiers.map((chantier) => (
          <section className="fr-accordion" key={chantier.id}>
            <h4 className="fr-accordion__title">
              <button
                aria-controls={`accordion-chantier-${chantier.id}`}
                aria-expanded={false}
                className="fr-accordion__btn"
                type="button"
              >
                {chantier.nom}
              </button>
            </h4>
            <div
              className="fr-collapse"
              id={`accordion-chantier-${chantier.id}`}
            >
              <a
                className="fr-link fr-mb-2w"
                href={`/chantier/${chantier.id}/${territoireCode}`}
              >
                Voir le chantier
              </a>
              {chantier.indicateurs.map((indicateur) => (
                <div className="fr-mb-3w" key={indicateur.id}>
                  <h5 className="fr-h5">{indicateur.nom}</h5>
                  <div className="fr-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Territoire</th>
                          <th>Type de valeur</th>
                          <th>Valeur</th>
                          <th>Date de valeur</th>
                          <th>Date d'événement</th>
                        </tr>
                      </thead>
                      <tbody>
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
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default RapportDetail;
