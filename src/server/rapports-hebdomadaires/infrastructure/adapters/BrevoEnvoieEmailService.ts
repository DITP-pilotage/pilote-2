import { EmailManager } from "@/server/infrastructure/email-manager";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnvoieEmailService } from "@/server/rapports-hebdomadaires/domain/ports/EnvoieEmailService";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import { PiloteDateFormatter } from "./PiloteDateFormatter";

const TEMPLATE_ID_RAPPORT_COORDINATEURS = 60;

export const createBrevoParams = ({
  profilsMap,
  rapport,
}: {
  profilsMap: Map<string, string>;
  rapport: RapportHebdomadaire;
}) => {
  const mapProfilToLabel = (code: string) => profilsMap.get(code) ?? code;

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

  const afficherSectionChantiersVA = rapport.chantiers.length > 0;

  const chantiers = rapport.chantiers.map((chantier) => ({
    id: chantier.id,
    nom: chantier.nom,
    indicateurs: chantier.indicateurs.flatMap((indic) => ({
      id: indic.id,
      nom: indic.nom,
      territoires: indic.territoires.map((territoire) => ({
        nom: formatTerritoireNom(territoire),
        type_indicateur: "va",
        valeur:
          territoire.valeurAvancement !== null
            ? Number.isInteger(territoire.valeurAvancement)
              ? territoire.valeurAvancement.toString()
              : territoire.valeurAvancement.toFixed(1)
            : "-",
        date_indicateur: PiloteDateFormatter.isoDateFranceMetropolitaine(territoire.dateValeur),
        date_modification: PiloteDateFormatter.isoDateFranceMetropolitaine(territoire.dateEvenement),
      })),
    })),
  }));

  return {
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
    afficherSectionChantiersVA,
    chantiers,
  };
};

export class BrevoEnvoieEmailService implements EnvoieEmailService {
  constructor(
    private readonly deps: {
      emailManager: EmailManager;
      prisma: PrismaPilote;
    },
  ) {}

  async envoyerRapportHebdomadaire({
    rapport,
  }: {
    rapport: RapportHebdomadaire;
  }): Promise<void> {
    const profilsMap = await this.getProfilsMap();
    const templateParams = createBrevoParams({
      profilsMap: profilsMap,
      rapport: rapport,
    });

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
