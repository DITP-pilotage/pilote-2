import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { formation_periode_information } from "@prisma/client";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { PilotePrismaClient } from "@/server/framework/persistence/PrismaTransaction";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import {
  aujourdhuiAParis,
  jourISO,
  schemaPeriode,
  statutPeriode,
  type Bornes,
  type JourISO,
} from "@/server/formations/domain/periodeInformation";
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
      const aujourdhui = aujourdhuiAParis(maintenant);
      const motifIds = [...new Set(commande.motifIds)];

      const periodeEnCours = await this.periodeEnCoursAModifier(
        client,
        commande.id,
        aujourdhui,
      );
      await this.verifierFormations(client, motifIds);
      this.validerSaisie(
        { ...commande, motifIds },
        { aujourdhui, periodeEnCours },
      );

      const periodesRemplacees = await this.supprimerPeriodesChevauchees(
        client,
        commande,
        maintenant,
      );
      const id = await this.enregistrer(client, { ...commande, motifIds });

      return { id, periodesRemplacees };
    });
  }

  // Refuse une période passée ou supprimée ; renvoie les bornes de la période
  // modifiée si elle est en cours, pour figer son début.
  private async periodeEnCoursAModifier(
    client: PilotePrismaClient,
    id: string | null,
    aujourdhui: JourISO,
  ): Promise<Bornes | null> {
    if (!id) return null;
    const periode = await client.formation_periode_information.findUnique({
      where: { id },
    });
    if (!periode) {
      throw new BadRequestError("Cette période n'existe plus.");
    }
    const bornes = bornesDe(periode);
    const statut = statutPeriode(
      { ...bornes, supprimee: periode.deleted_at !== null },
      aujourdhui,
    );
    if (statut === "SUPPRIMEE") {
      throw new BadRequestError("Une période supprimée ne se modifie plus.");
    }
    if (statut === "PASSEE") {
      throw new BadRequestError("Une période passée ne se modifie plus.");
    }
    return statut === "EN_COURS" ? bornes : null;
  }

  private async verifierFormations(
    client: PilotePrismaClient,
    motifIds: number[],
  ): Promise<void> {
    const existants = await client.formation_motif.findMany({
      where: { id: { in: motifIds.map((motifId) => BigInt(motifId)) } },
      select: { id: true },
    });
    const idsExistants = new Set(existants.map((motif) => Number(motif.id)));
    const introuvables = motifIds.filter(
      (motifId) => !idsExistants.has(motifId),
    );
    if (introuvables.length > 0) {
      throw new BadRequestError(
        `Formations introuvables : ${introuvables.join(", ")}.`,
      );
    }
  }

  private validerSaisie(
    saisie: SavePeriodeInformationCommand,
    contexte: { aujourdhui: JourISO; periodeEnCours: Bornes | null },
  ): void {
    const resultat = schemaPeriode(contexte).safeParse(saisie);
    if (!resultat.success) {
      throw new BadRequestError(
        resultat.error.issues.map((issue) => issue.message).join(" "),
      );
    }
  }

  // Bornes comprises, en excluant la période modifiée elle-même.
  private async supprimerPeriodesChevauchees(
    client: PilotePrismaClient,
    commande: SavePeriodeInformationCommand,
    maintenant: Date,
  ): Promise<Bornes[]> {
    const chevauchees = await client.formation_periode_information.findMany({
      where: {
        id: commande.id ? { not: commande.id } : undefined,
        deleted_at: null,
        date_debut: { lte: new Date(commande.dateFin) },
        date_fin: { gte: new Date(commande.dateDebut) },
      },
      orderBy: { date_debut: "asc" },
    });
    if (chevauchees.length > 0) {
      await client.formation_periode_information.updateMany({
        where: { id: { in: chevauchees.map((periode) => periode.id) } },
        data: { deleted_at: maintenant },
      });
    }
    return chevauchees.map(bornesDe);
  }

  private async enregistrer(
    client: PilotePrismaClient,
    commande: SavePeriodeInformationCommand,
  ): Promise<string> {
    const id = commande.id ?? randomUUID();
    const dates = {
      date_debut: new Date(commande.dateDebut),
      date_fin: new Date(commande.dateFin),
    };
    const motifs = {
      create: commande.motifIds.map((motifId) => ({
        motif_id: BigInt(motifId),
      })),
    };
    await client.formation_periode_information.upsert({
      where: { id },
      create: { id, ...dates, motifs },
      update: { ...dates, motifs: { deleteMany: {}, ...motifs } },
    });
    return id;
  }
}

function bornesDe(periode: formation_periode_information): Bornes {
  return {
    dateDebut: jourISO(periode.date_debut),
    dateFin: jourISO(periode.date_fin),
  };
}
