import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";
import type { Inject } from "@/server/metadataChantier/module";
import {
  MAILLES,
  Maille,
  LIBELLÉ_MAILLE_ADJECTIF,
  calculerMaillesApplicablesIndicateur,
} from "@/server/metadataChantier/domain/maille";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

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

const CHAMP_POIDS_PAR_MAILLE: Record<
  Maille,
  keyof Pick<
    LigneEnregistrementPonderation,
    "poidsPourcentDept" | "poidsPourcentReg" | "poidsPourcentNat"
  >
> = {
  NAT: "poidsPourcentNat",
  REG: "poidsPourcentReg",
  DEPT: "poidsPourcentDept",
};

export class EnregistrerPonderationsIndicateursHandler {
  private readonly prisma: PrismaPilote;

  constructor(private readonly dependencies: Inject<"prisma" | "transaction">) {
    this.prisma = dependencies.prisma;
  }

  async execute(
    command: EnregistrerPonderationsIndicateursCommand,
  ): Promise<void> {
    const instance = this.prisma.getInstance();
    const indicIds = command.lignes.map((ligne) => ligne.indicId);
    const indicateurs = await instance.metadata_indicateurs_hidden.findMany({
      where: { indic_id: { in: indicIds } },
      include: { complementaire: true },
    });
    const complémentaireParId = new Map(
      indicateurs.map((indicateur) => [
        indicateur.indic_id,
        indicateur.complementaire,
      ]),
    );

    for (const maille of MAILLES) {
      const lignesConcernées = command.lignes.filter((ligne) => {
        const complémentaire = complémentaireParId.get(ligne.indicId);
        return calculerMaillesApplicablesIndicateur(
          complémentaire?.indic_territorialise ?? false,
          complémentaire?.mailles ?? null,
        ).includes(maille);
      });
      if (lignesConcernées.length === 0) continue;

      const somme = lignesConcernées.reduce(
        (total, ligne) => total + (ligne[CHAMP_POIDS_PAR_MAILLE[maille]] ?? 0),
        0,
      );
      if (somme !== 100) {
        throw new BadRequestError(
          `La somme des pondérations pour la maille ${LIBELLÉ_MAILLE_ADJECTIF[maille]} doit être égale à 100 (actuellement ${somme}).`,
        );
      }
    }

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
