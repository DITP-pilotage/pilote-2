import { z } from "zod";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { HistorisationModification } from "@/server/historisation-modification/domain/HistorisationModification";
import type { Inject } from "@/server/parametrage-chantier/module";

export const ligneEnregistrementPonderationSchema = z.object({
  indicId: z.string(),
  poidsPourcentDept: z.number().nullable(),
  poidsPourcentReg: z.number().nullable(),
  poidsPourcentNat: z.number().nullable(),
  estActif: z.boolean(),
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

export class SavePonderationsIndicateursHandler {
  constructor(
    private readonly dependencies: Inject<
      | "transaction"
      | "metadataParametrageIndicateurRepository"
      | "historisationModificationRepository"
    >,
  ) {}

  async execute(
    command: EnregistrerPonderationsIndicateursCommand,
    auteurId: string,
  ): Promise<void> {
    await this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();
      await Promise.all(
        command.lignes.map(async (ligne) => {
          const ancien =
            await this.dependencies.metadataParametrageIndicateurRepository.recupererMetadataParametrageIndicateurParIndicId(
              ligne.indicId,
            );

          const statutModifie = ancien.indicHiddenPilote === ligne.estActif;
          if (statutModifie) {
            await prisma.metadata_indicateurs_hidden.update({
              where: { indic_id: ligne.indicId },
              data: { indic_hidden_pilote: !ligne.estActif },
            });
          }

          await prisma.metadata_parametrage_indicateurs.update({
            where: { indic_id: ligne.indicId },
            data: {
              poids_pourcent_dept_declaree: ligne.poidsPourcentDept,
              poids_pourcent_reg_declaree: ligne.poidsPourcentReg,
              poids_pourcent_nat_declaree: ligne.poidsPourcentNat,
            },
          });

          const nouveau = ancien
            .avecPonderationsDeclarees({
              poidsPourcentDept: ligne.poidsPourcentDept,
              poidsPourcentReg: ligne.poidsPourcentReg,
              poidsPourcentNat: ligne.poidsPourcentNat,
            })
            .avecStatutActif(ligne.estActif);

          const historisations = (
            [
              "metadata_indicateurs",
              "metadata_parametrages_indicateurs",
            ] as const
          ).map((tableModifieId) =>
            HistorisationModification.creerHistorisationModification({
              auteurId,
              tableModifieId,
              ancienneValeur: ancien,
              nouvelleValeur: nouveau,
            }),
          );

          for (const historisation of historisations) {
            if (historisation.aDesModifications()) {
              await this.dependencies.historisationModificationRepository.sauvegarderModificationHistorisation(
                historisation,
              );
            }
          }
        }),
      );
    });
  }
}
