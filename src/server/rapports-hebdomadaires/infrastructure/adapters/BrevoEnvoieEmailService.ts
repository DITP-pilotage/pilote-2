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

  const formatValeurAvancement = (valeur: number | null): string => {
    if (valeur === null) {
      return "-";
    }
    return Number.isInteger(valeur) ? valeur.toString() : valeur.toFixed(1);
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
          ? compte.territoires.map(formatTerritoireNom).join(", ")
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
          ? compte.territoires.map(formatTerritoireNom).join(", ")
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
        // TODO : extraire mapper ou table de correspondance
        type_indicateur:
          territoire.typeValeur === "VALEUR_AVANCEMENT"
            ? "va"
            : territoire.typeValeur === "VALEUR_INITIALE"
              ? "vi"
              : "vc",
        valeur: formatValeurAvancement(territoire.valeur),
        date_indicateur: PiloteDateFormatter.isoDateFranceMetropolitaine(
          territoire.dateValeur,
        ),
        date_modification: PiloteDateFormatter.isoDateFranceMetropolitaine(
          territoire.dateEvenement,
        ),
      })),
    })),
  }));

  return {
    prenom: rapport.coordinateur.prenom,
    nom: rapport.coordinateur.nom,
    territoire: rapport.coordinateur.territoires
      .map(formatTerritoireNom)
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
