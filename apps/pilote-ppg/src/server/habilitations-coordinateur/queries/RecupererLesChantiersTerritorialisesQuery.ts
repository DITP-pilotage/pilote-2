import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/habilitations-coordinateur/module";

export type ChantierTerritorialise = {
  id: string;
  nom: string;
  ate: string | null;
  territoiresApplicables: string[];
};

export class RecupererLesChantiersTerritorialisesQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<ChantierTerritorialise[]> {
    const chantiers = await this.prisma
      .getInstance()
      .chantier_identite.findMany({
        where: {
          statut: "PUBLIE",
          est_territorialise: true,
        },
        select: {
          id: true,
          nom: true,
          ate: true,
          chantier_territoire: {
            where: { est_applicable: true },
            select: { territoire_code: true },
          },
        },
      });

    return chantiers.map((chantier) => ({
      id: chantier.id,
      nom: chantier.nom,
      ate: chantier.ate,
      territoiresApplicables: chantier.chantier_territoire.map(
        (territoire) => territoire.territoire_code,
      ),
    }));
  }
}
