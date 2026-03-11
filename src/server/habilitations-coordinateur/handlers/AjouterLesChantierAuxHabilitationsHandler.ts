import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/habilitations-coordinateur/module";

export const ajouterLesChantierAuxHabilitationsCommandSchema = z.object({
  chantierIds: z.array(z.string()).min(1),
  scope: z.enum(["saisieCommentaire", "gestionUtilisateur"]),
});

export type AjouterLesChantierAuxHabilitationsCommand = z.infer<
  typeof ajouterLesChantierAuxHabilitationsCommandSchema
>;

export class AjouterLesChantierAuxHabilitationsHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(
    command: AjouterLesChantierAuxHabilitationsCommand,
  ): Promise<void> {
    const prisma = this.prisma.getInstance();

    const territoiresParChantier = await this.recupererTerritoiresApplicables(
      prisma,
      command.chantierIds,
    );

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
      const chantiersEligibles = command.chantierIds.filter((chantierId) => {
        const territoiresApplicables = territoiresParChantier.get(chantierId);
        if (!territoiresApplicables) return false;
        return habilitation.territoires.some((territoire) =>
          territoiresApplicables.has(territoire),
        );
      });

      if (chantiersEligibles.length === 0) continue;

      const chantiersFusionnes = Array.from(
        new Set([...habilitation.chantiers, ...chantiersEligibles]),
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

  private async recupererTerritoiresApplicables(
    prisma: ReturnType<PrismaPilote["getInstance"]>,
    chantierIds: string[],
  ): Promise<Map<string, Set<string>>> {
    const chantierTerritoires = await prisma.chantier_territoire.findMany({
      where: {
        id: { in: chantierIds },
        est_applicable: true,
      },
      select: {
        id: true,
        territoire_code: true,
      },
    });

    const map = new Map<string, Set<string>>();
    for (const row of chantierTerritoires) {
      const set = map.get(row.id) ?? new Set();
      set.add(row.territoire_code);
      map.set(row.id, set);
    }
    return map;
  }
}
