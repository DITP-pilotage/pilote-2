import { z } from "zod";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import {
  aujourdhuiAParis,
  validerPeriode,
} from "@/server/formations/domain/periodeInformation";
import {
  bornesDepuisBase,
  dateBaseDepuisJour,
} from "@/server/formations/infrastructure/joursBase";
import { verrouillerPeriodes } from "@/server/formations/infrastructure/verrouPeriodes";
import type { Inject } from "@/server/formations/module";

const jourISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const savePeriodeInformationCommandSchema = z.object({
  id: z.string().uuid().nullable(),
  dateDebut: jourISO,
  dateFin: jourISO,
  motifIds: z.array(z.number().int()),
});

export type SavePeriodeInformationCommand = z.infer<
  typeof savePeriodeInformationCommandSchema
>;

export class SavePeriodeInformationHandler {
  private readonly prisma: PrismaPilote;

  private readonly transaction: Inject<"transaction">["transaction"];

  constructor({ prisma, transaction }: Inject<"prisma" | "transaction">) {
    this.prisma = prisma;
    this.transaction = transaction;
  }

  async execute({
    commande,
    maintenant,
  }: {
    commande: SavePeriodeInformationCommand;
    maintenant: Date;
  }): Promise<{ id: string }> {
    return this.transaction.run(async () => {
      const client = this.prisma.getInstance();
      await verrouillerPeriodes(client);

      const periodes = await client.formation_periode_information.findMany();
      const periodeModifiee = commande.id
        ? periodes.find((periode) => periode.id === commande.id)
        : null;
      if (commande.id && !periodeModifiee) {
        throw new BadRequestError("Cette période n'existe plus.");
      }

      const motifIds = [...new Set(commande.motifIds)];
      const nombreMotifsValides = await client.formation_motif.count({
        where: {
          id: { in: motifIds.map((motifId) => BigInt(motifId)) },
          date_suppression: null,
        },
      });
      if (nombreMotifsValides !== motifIds.length) {
        throw new BadRequestError(
          "Une des formations choisies n'existe plus dans RDV-SP.",
        );
      }

      const erreurs = validerPeriode({
        saisie: {
          dateDebut: commande.dateDebut,
          dateFin: commande.dateFin,
          motifIds,
        },
        periodeModifiee: periodeModifiee
          ? bornesDepuisBase(periodeModifiee)
          : null,
        autresPeriodes: periodes
          .filter((periode) => periode.id !== commande.id)
          .map(bornesDepuisBase),
        aujourdhui: aujourdhuiAParis(maintenant),
      });
      const messages = Object.values(erreurs);
      if (messages.length > 0) {
        throw new BadRequestError(messages.join(" "));
      }

      const dates = {
        date_debut: dateBaseDepuisJour(commande.dateDebut),
        date_fin: dateBaseDepuisJour(commande.dateFin),
      };
      const periode = periodeModifiee
        ? await client.formation_periode_information.update({
            where: { id: periodeModifiee.id },
            data: dates,
          })
        : await client.formation_periode_information.create({ data: dates });

      await client.formation_periode_information_motif.deleteMany({
        where: { periode_id: periode.id },
      });
      await client.formation_periode_information_motif.createMany({
        data: motifIds.map((motifId) => ({
          periode_id: periode.id,
          motif_id: BigInt(motifId),
        })),
      });

      return { id: periode.id };
    });
  }
}
