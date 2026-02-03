import { EmailManager } from "@/server/infrastructure/email-manager";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnvoieEmailService } from "@/server/rapports-hebdomadaires/domain/ports/EnvoieEmailService";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";

const TEMPLATE_ID_RAPPORT_COORDINATEURS = 60;

export class BrevoEnvoieEmailService implements EnvoieEmailService {
  constructor(
    private readonly deps: {
      emailManager: EmailManager;
      prisma: PrismaPilote;
    },
  ) {}

  async envoyerRapportHebdomadaire(params: {
    rapport: RapportHebdomadaire;
  }): Promise<void> {
    const { rapport } = params;

    const profilsMap = await this.getProfilsMap();
    const mapProfilToLabel = (code: string) => profilsMap.get(code) ?? code;

    const afficherComptesCrees =
      rapport.sectionActiviteComptes.comptesCrees.length > 0;
    const afficherComptesDesactives =
      rapport.sectionActiviteComptes.comptesDesactives.length > 0;
    const afficherSectionComptes =
      afficherComptesCrees || afficherComptesDesactives;

    const comptesCrees = rapport.sectionActiviteComptes.comptesCrees.map(
      (compte) => ({
        nom: compte.nom,
        prenom: compte.prenom,
        email: compte.email,
        profil: mapProfilToLabel(compte.profil),
        territoire:
          compte.territoires.length > 0
            ? compte.territoires.map((t) => t.nom).join(", ")
            : undefined,
      }),
    );

    const comptesDesactives =
      rapport.sectionActiviteComptes.comptesDesactives.map((compte) => ({
        nom: compte.nom,
        prenom: compte.prenom,
        email: compte.email,
        profil: mapProfilToLabel(compte.profil),
        territoire:
          compte.territoires.length > 0
            ? compte.territoires.map((t) => t.nom).join(", ")
            : undefined,
      }));

    const templateParams = {
      prenom: rapport.coordinateur.prenom,
      nom: rapport.coordinateur.nom,
      territoire: rapport.coordinateur.territoires
        .map((territoire) => territoire.nom)
        .join(", "),
      afficherComptesCrees,
      afficherSectionComptes,
      comptesCrees,
      afficherComptesDesactives,
      comptesDesactives,
    };

    await this.deps.emailManager.sendTransactionalEmail(
      [{ email: rapport.coordinateur.email }],
      TEMPLATE_ID_RAPPORT_COORDINATEURS,
      templateParams,
    );
  }

  private async getProfilsMap() {
    const prisma = this.deps.prisma.getInstance();
    const profils = await prisma.profil.findMany();
    return new Map(profils.map((p) => [p.code, p.nom]));
  }
}
