import { z } from "zod";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import {
  aujourdhuiAParis,
  jourISO,
  schemaPeriode,
  statutPeriode,
  type Bornes,
} from "@/server/formations/domain/periodeInformation";
import { verrouillerPeriodes } from "@/server/formations/infrastructure/verrouPeriodes";
import type { Inject } from "@/server/formations/module";

export const savePeriodeInformationCommandSchema = z.object({
  id: z.uuid().nullable(),
  dateDebut: z.iso.date(),
  dateFin: z.iso.date(),
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
  }): Promise<{ id: string; periodesRemplacees: Bornes[] }> {
    return this.transaction.run(async () => {
      const client = this.prisma.getInstance();
      await verrouillerPeriodes(client);
      const aujourdhui = aujourdhuiAParis(maintenant);

      const periodeModifiee = commande.id
        ? await client.formation_periode_information.findUnique({
            where: { id: commande.id },
          })
        : null;
      if (commande.id && !periodeModifiee) {
        throw new BadRequestError("Cette période n'existe plus.");
      }
      const statut = periodeModifiee
        ? statutPeriode(
            {
              dateDebut: jourISO(periodeModifiee.date_debut),
              dateFin: jourISO(periodeModifiee.date_fin),
              supprimee: periodeModifiee.deleted_at !== null,
            },
            aujourdhui,
          )
        : null;
      if (statut === "SUPPRIMEE") {
        throw new BadRequestError("Une période supprimée ne se modifie plus.");
      }
      if (statut === "PASSEE") {
        throw new BadRequestError("Une période passée ne se modifie plus.");
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

      const saisie = schemaPeriode({
        aujourdhui,
        debutFige:
          statut === "EN_COURS" && periodeModifiee
            ? jourISO(periodeModifiee.date_debut)
            : null,
      }).safeParse({ ...commande, motifIds });
      if (!saisie.success) {
        throw new BadRequestError(
          saisie.error.issues.map((issue) => issue.message).join(" "),
        );
      }

      const dates = {
        date_debut: new Date(commande.dateDebut),
        date_fin: new Date(commande.dateFin),
      };
      const periodesChevauchees =
        await client.formation_periode_information.findMany({
          where: {
            id: commande.id ? { not: commande.id } : undefined,
            deleted_at: null,
            date_debut: { lte: dates.date_fin },
            date_fin: { gte: dates.date_debut },
          },
          orderBy: { date_debut: "asc" },
        });
      await client.formation_periode_information.updateMany({
        where: {
          id: { in: periodesChevauchees.map((periode) => periode.id) },
        },
        data: { deleted_at: maintenant },
      });

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

      return {
        id: periode.id,
        periodesRemplacees: periodesChevauchees.map((chevauchee) => ({
          dateDebut: jourISO(chevauchee.date_debut),
          dateFin: jourISO(chevauchee.date_fin),
        })),
      };
    });
  }
}
