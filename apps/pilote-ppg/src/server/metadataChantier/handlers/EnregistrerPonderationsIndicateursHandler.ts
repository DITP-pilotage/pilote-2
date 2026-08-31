import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";
import {
  MAILLES,
  Maille,
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

const TOLÉRANCE_SOMME = 0.01;

const LIBELLÉ_MAILLE: Record<Maille, string> = {
  NAT: "nationale",
  REG: "régionale",
  DEPT: "départementale",
};

export class EnregistrerPonderationsIndicateursHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(
    command: EnregistrerPonderationsIndicateursCommand,
  ): Promise<void> {
    const instance = this.prisma.getInstance();
    const indicIds = command.lignes.map((ligne) => ligne.indicId);
    const complémentaires =
      await instance.metadata_indicateurs_complementaire.findMany({
        where: { indic_id: { in: indicIds } },
      });
    const complémentaireParId = new Map(
      complémentaires.map((complémentaire) => [
        complémentaire.indic_id,
        complémentaire,
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
      if (Math.abs(somme - 100) > TOLÉRANCE_SOMME) {
        throw new BadRequestError(
          `La somme des pondérations pour la maille ${LIBELLÉ_MAILLE[maille]} doit être égale à 100 (actuellement ${somme}).`,
        );
      }
    }

    await Promise.all(
      command.lignes.map((ligne) =>
        instance.metadata_parametrage_indicateurs.update({
          where: { indic_id: ligne.indicId },
          data: {
            poids_pourcent_dept_declaree: ligne.poidsPourcentDept,
            poids_pourcent_reg_declaree: ligne.poidsPourcentReg,
            poids_pourcent_nat_declaree: ligne.poidsPourcentNat,
          },
        }),
      ),
    );
  }
}
