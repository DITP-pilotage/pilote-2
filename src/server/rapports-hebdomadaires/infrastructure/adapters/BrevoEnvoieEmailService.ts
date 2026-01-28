import { EmailManager } from "@/server/infrastructure/email-manager";
import { EnvoieEmailService } from "@/server/rapports-hebdomadaires/domain/ports/EnvoieEmailService";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";

const TEMPLATE_ID_RAPPORT_COORDINATEURS = 60;

export class BrevoEnvoieEmailService implements EnvoieEmailService {
  constructor(
    private readonly deps: {
      emailManager: EmailManager;
    },
  ) {}

  async envoyerRapportHebdomadaire(params: {
    rapport: RapportHebdomadaire;
  }): Promise<void> {
    const { rapport } = params;

    const afficherComptesCrees =
      rapport.sectionActiviteComptes.comptesCrees.length > 0;
    const afficherComptesDesactives =
      rapport.sectionActiviteComptes.comptesDesactives.length > 0;
    const afficherSectionComptes =
      afficherComptesCrees || afficherComptesDesactives;
    const templateParams = {
      prenom: rapport.coordinateur.prenom,
      nom: rapport.coordinateur.nom,
      territoire: rapport.coordinateur.territoires
        .map((territoire) => territoire.nom)
        .join(", "),
      afficherComptesCrees,
      afficherSectionComptes,
      comptesCrees: rapport.sectionActiviteComptes.comptesCrees.map(
        (compte) => ({
          nom: compte.nom,
          prenom: compte.prenom,
          email: compte.email,
          profil: compte.profil,
          territoire:
            compte.territoires.length > 0
              ? compte.territoires.map((t) => t.nom).join(", ")
              : undefined,
        }),
      ),
      afficherComptesDesactives,
      comptesDesactives: rapport.sectionActiviteComptes.comptesDesactives.map(
        (compte) => ({
          nom: compte.nom,
          prenom: compte.prenom,
          email: compte.email,
          profil: compte.profil,
          territoire:
            compte.territoires.length > 0
              ? compte.territoires.map((t) => t.nom).join(", ")
              : undefined,
        }),
      ),
    };

    await this.deps.emailManager.sendTransactionalEmail(
      // TODO (CHAN - Rapport) : mettre le bon email quand débuggué :)
      [{ email: "antoine.chalifour@gmail.com" }],
      // [{ email: rapport.coordinateur.email }],
      TEMPLATE_ID_RAPPORT_COORDINATEURS,
      templateParams,
    );
  }
}
