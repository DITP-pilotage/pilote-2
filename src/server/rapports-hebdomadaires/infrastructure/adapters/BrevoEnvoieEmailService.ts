import { EmailManager } from "@/server/infrastructure/email-manager";
import { EnvoieEmailService } from "@/server/rapports-hebdomadaires/domain/ports/EnvoieEmailService";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";

const TEMPLATE_ID_RAPPORT_COORDINATEURS = 68;

export const createBrevoParams = ({
  rapport,
}: {
  rapport: RapportHebdomadaire;
}) => {
  const formatTerritoireNom = (territoire: { code: string; nom: string }) => {
    if (territoire.code.startsWith("DEPT-")) {
      const deptCode = territoire.code.replace("DEPT-", "");
      return `${deptCode} - ${territoire.nom}`;
    }
    return territoire.nom;
  };

  const afficherComptesCrees =
    rapport.sectionActiviteComptes.comptesCrees.length > 0;
  const afficherComptesDesactives =
    rapport.sectionActiviteComptes.comptesDesactives.length > 0;
  const afficherSectionComptes =
    afficherComptesCrees || afficherComptesDesactives;

  const nbComptesCrees = rapport.sectionActiviteComptes.comptesCrees.length;
  const nbComptesDesactives =
    rapport.sectionActiviteComptes.comptesDesactives.length;

  const afficherSectionChantiers = rapport.chantiers.length > 0;

  const chantiers = rapport.chantiers.map((chantier) => ({
    id: chantier.id,
    nom: chantier.nom,
  }));

  return {
    prenom: rapport.coordinateur.prenom,
    nom: rapport.coordinateur.nom,
    territoire: rapport.coordinateur.territoires
      .map(formatTerritoireNom)
      .join(", "),
    afficherSectionComptes,
    nbComptesCrees,
    nbComptesDesactives,
    afficherSectionChantiers,
    chantiers,
  };
};

export class BrevoEnvoieEmailService implements EnvoieEmailService {
  constructor(private readonly deps: { emailManager: EmailManager }) {}

  async envoyerRapportHebdomadaire({
    rapport,
  }: {
    rapport: RapportHebdomadaire;
  }): Promise<void> {
    const templateParams = createBrevoParams({
      rapport: rapport,
    });

    await this.deps.emailManager.sendTransactionalEmail(
      [{ email: rapport.coordinateur.email }],
      TEMPLATE_ID_RAPPORT_COORDINATEURS,
      templateParams,
    );
  }
}
