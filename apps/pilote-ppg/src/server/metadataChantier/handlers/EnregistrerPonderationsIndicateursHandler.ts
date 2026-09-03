import { z } from "zod";
import { getPrisma } from "@/server/db/PrismaTransaction";
import type { Inject } from "@/server/metadataChantier/module";

export const ligneEnregistrementPonderationSchema = z.object({
  indicId: z.string(),
  poidsPourcentDept: z.number().nullable(),
  poidsPourcentReg: z.number().nullable(),
  poidsPourcentNat: z.number().nullable(),
});

export const enregistrerPonderationsIndicateursCommandSchema = z.object({
  lignes: z.array(ligneEnregistrementPonderationSchema),
});

export type LigneEnregistrementPonderation = z.infer<
  typeof ligneEnregistrementPonderationSchema
>;
export type EnregistrerPonderationsIndicateursCommand = z.infer<
  typeof enregistrerPonderationsIndicateursCommandSchema
>;

export class EnregistrerPonderationsIndicateursHandler {
  constructor(private readonly dependencies: Inject<"transaction">) {}

  async execute(
    command: EnregistrerPonderationsIndicateursCommand,
  ): Promise<void> {
    await this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();
      await Promise.all(
        command.lignes.map((ligne) =>
          prisma.metadata_parametrage_indicateurs.update({
            where: { indic_id: ligne.indicId },
            data: {
              poids_pourcent_dept_declaree: ligne.poidsPourcentDept,
              poids_pourcent_reg_declaree: ligne.poidsPourcentReg,
              poids_pourcent_nat_declaree: ligne.poidsPourcentNat,
            },
          }),
        ),
      );
    });
  }
}
