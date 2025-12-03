import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type UtilisateurPiloteEval = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
};

export class ListerUtilisateursPiloteEval {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run(): Promise<UtilisateurPiloteEval[]> {
    return this.dependencies.prisma.getInstance().utilisateur.findMany({
      where: {
        date_desactivation: null,
        applications_accessibles: {
          has: $Enums.application_accessible.PILOTE_EVAL,
        },
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        profilCode: true,
      },
    });
  }
}
