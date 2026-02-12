import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export const ajouterLesChantierAuxHabilitationsCommandSchema = z.object({
  chantierIds: z.array(z.string()).min(1),
  scope: z.enum(["saisieCommentaire", "gestionUtilisateur"]),
});

export type AjouterLesChantierAuxHabilitationsCommand = z.infer<
  typeof ajouterLesChantierAuxHabilitationsCommandSchema
>;

export class AjouterLesChantierAuxHabilitationsHandler {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async execute(
    command: AjouterLesChantierAuxHabilitationsCommand,
  ): Promise<void> {
    const prisma = this.dependencies.prisma.getInstance();

    const habilitations = await prisma.habilitation.findMany({
      where: {
        scopeCode: command.scope,
        utilisateur: {
          profilCode: {
            in: ["COORDINATEUR_REGION", "COORDINATEUR_DEPARTEMENT"],
          },
        },
      },
    });

    for (const habilitation of habilitations) {
      const chantiersFusionnes = Array.from(
        new Set([...habilitation.chantiers, ...command.chantierIds]),
      );

      await prisma.habilitation.update({
        where: {
          utilisateurId_scopeCode: {
            utilisateurId: habilitation.utilisateurId,
            scopeCode: command.scope,
          },
        },
        data: { chantiers: chantiersFusionnes },
      });
    }
  }
}
