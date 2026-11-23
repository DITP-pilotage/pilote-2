import { z } from "zod";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import type { Inject } from "@/server/formations/module";

export const recordSlideInActionCommandSchema = z.object({
  periodeId: z.uuid(),
  action: z.enum(["PRESENTATION", "REPORT", "FERMETURE"]),
});

export type RecordSlideInActionCommand = z.infer<
  typeof recordSlideInActionCommandSchema
>;

const COLONNE_DE_L_ACTION = {
  PRESENTATION: null,
  REPORT: "date_report",
  FERMETURE: "date_fermeture",
} as const;

export class RecordSlideInActionHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({
    utilisateurId,
    periodeId,
    action,
    maintenant,
  }: RecordSlideInActionCommand & {
    utilisateurId: string;
    maintenant: Date;
  }): Promise<void> {
    const client = this.prisma.getInstance();

    // Même supprimée, la période reste valable : un report sur une période qu'un
    // admin vient de supprimer est sans effet sur l'affichage.
    const periode = await client.formation_periode_information.findUnique({
      where: { id: periodeId },
      select: { id: true },
    });
    if (!periode) {
      throw new BadRequestError("Cette période d'information n'existe pas.");
    }

    const colonne = COLONNE_DE_L_ACTION[action];
    const dateDeLAction = colonne === null ? {} : { [colonne]: maintenant };

    await client.formation_periode_information_utilisateur.upsert({
      where: {
        utilisateur_id_periode_id: {
          utilisateur_id: utilisateurId,
          periode_id: periodeId,
        },
      },
      create: {
        utilisateur_id: utilisateurId,
        periode_id: periodeId,
        date_presentation: maintenant,
        ...dateDeLAction,
      },
      update: dateDeLAction,
    });
  }
}
