import { PrismaPilote } from "@/server/db/PrismaPilote";
import { CoordinateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/CoordinateurGateway";
import {
  Coordinateur,
  ProfilCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";

export class PrismaCoordinateurGateway implements CoordinateurGateway {
  constructor(
    private readonly deps: {
      prisma: PrismaPilote;
    },
  ) {}

  async recupererCoordinateurs(params: {
    profils: ProfilCoordinateur[];
  }): Promise<Coordinateur[]> {
    const prisma = this.deps.prisma.getInstance();

    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        profilCode: { in: params.profils },
        date_desactivation: null,
      },
      include: {
        habilitation: {
          select: {
            territoires: true,
          },
        },
      },
    });

    const coordinateurs: Coordinateur[] = [];

    for (const utilisateur of utilisateurs) {
      const territoireCode = this.extraireTerritoirePrincipal(
        utilisateur.habilitation,
      );
      if (!territoireCode) continue;

      const territoire = await prisma.territoire.findUnique({
        where: { code: territoireCode },
        include: {
          territoire_enfant: {
            select: { code: true },
          },
        },
      });

      if (!territoire) continue;

      coordinateurs.push({
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        profil: utilisateur.profilCode as ProfilCoordinateur,
        territoire: {
          code: territoire.code,
          nom: territoire.nom,
          maille: territoire.maille === "REG" ? "REG" : "DEPT",
          codesEnfants: territoire.territoire_enfant.map((t) => t.code),
        },
      });
    }

    return coordinateurs;
  }

  private extraireTerritoirePrincipal(
    habilitations: { territoires: string[] }[],
  ): string | undefined {
    const habilitationAvecTerritoire = habilitations.find(
      (h) => h.territoires.length > 0,
    );
    return habilitationAvecTerritoire?.territoires[0];
  }
}
