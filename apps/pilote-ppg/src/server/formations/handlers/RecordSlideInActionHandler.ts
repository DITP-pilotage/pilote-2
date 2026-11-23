import { z } from "zod";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import type { Inject } from "@/server/formations/module";

export const recordSlideInActionCommandSchema = z.object({
  periodeId: z.uuid(),
  action: z.enum(["PRESENTATION", "FERMETURE"]),
});

export type RecordSlideInActionCommand = z.infer<
  typeof recordSlideInActionCommandSchema
>;

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

    // Même supprimée, la période reste valable : une fermeture sur une période qu'un
    // admin vient de supprimer est sans effet sur l'affichage.
    const periode = await client.formation_periode_information.findUnique({
      where: { id: periodeId },
      select: { id: true },
    });
    if (!periode) {
      throw new BadRequestError("Cette période d'information n'existe pas.");
    }

    const fermeture =
      action === "FERMETURE" ? { date_fermeture: maintenant } : {};

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
        ...fermeture,
      },
      update: fermeture,
    });
  }
}
