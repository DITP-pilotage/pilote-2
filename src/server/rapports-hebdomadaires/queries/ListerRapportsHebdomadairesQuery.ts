import { type $Enums } from "@prisma/client";

import { type PrismaPilote } from "@/server/infrastructure/test/integrationTestHelper.interface";

export type RapportHebdomadaireResume = {
  id: string;
  periodeDebut: Date;
  periodeFin: Date;
  statutEnvoi: $Enums.statut_envoi_rapport;
  dateCreation: Date;
};

export default class ListerRapportsHebdomadairesQuery {
  private prisma: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma;
  }

  async run(coordinateurId: string): Promise<RapportHebdomadaireResume[]> {
    const rapports = await this.prisma.rapport_hebdomadaire.findMany({
      where: {
        coordinateur_id: coordinateurId,
      },
      select: {
        id: true,
        periode_debut: true,
        periode_fin: true,
        statut_envoi: true,
        date_creation: true,
      },
      orderBy: {
        date_creation: "desc",
      },
    });

    return rapports.map((rapport) => ({
      id: rapport.id,
      periodeDebut: rapport.periode_debut,
      periodeFin: rapport.periode_fin,
      statutEnvoi: rapport.statut_envoi,
      dateCreation: rapport.date_creation,
    }));
  }
}
