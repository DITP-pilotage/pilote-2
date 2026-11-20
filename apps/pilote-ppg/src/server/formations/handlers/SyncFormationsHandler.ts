import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/formations/module";
import type { ImportFormationsInput } from "@/validation/import-formations";

export type SyncFormationsCommand = ImportFormationsInput;

// Une séance sans agent, ou un agent sans prénom ni nom, ne doit pas bloquer tout
// l'import : les noms absents ou vides sont ignorés.
function nomsAnimateurs(
  animateurs: SyncFormationsCommand["seances"][number]["animateurs"],
): string[] {
  return (animateurs ?? [])
    .map((nom) => nom?.trim() ?? "")
    .filter((nom) => nom.length > 0);
}

export interface ResultatSyncFormations {
  motifs: { ecrits: number; retires: number };
  seances: { ecrites: number };
}

export class SyncFormationsHandler {
  private readonly prisma: PrismaPilote;

  private readonly transaction: Inject<"transaction">["transaction"];

  constructor({ prisma, transaction }: Inject<"prisma" | "transaction">) {
    this.prisma = prisma;
    this.transaction = transaction;
  }

  // L'envoi est l'état complet de RDV-SP : les motifs absents sont retirés (jamais
  // effacés, le paramétrage les référence), les séances sont rechargées.
  async execute({
    commande,
    maintenant,
  }: {
    commande: SyncFormationsCommand;
    maintenant: Date;
  }): Promise<ResultatSyncFormations> {
    return this.transaction.run(async () => {
      const client = this.prisma.getInstance();
      const motifIds = commande.motifs.map((motif) => BigInt(motif.id));

      for (const motif of commande.motifs) {
        await client.formation_motif.upsert({
          where: { id: BigInt(motif.id) },
          create: { id: BigInt(motif.id), nom: motif.nom },
          update: { nom: motif.nom, deleted_at: null },
        });
      }
      const { count: retires } = await client.formation_motif.updateMany({
        where: { id: { notIn: motifIds }, deleted_at: null },
        data: { deleted_at: maintenant },
      });

      await client.formation_seance.deleteMany({});
      const { count: ecrites } = await client.formation_seance.createMany({
        data: commande.seances.map((seance) => ({
          id: BigInt(seance.id),
          motif_id: BigInt(seance.motif_id),
          date_debut: new Date(seance.date_debut),
          duree_minutes: seance.duree_minutes,
          animateurs: nomsAnimateurs(seance.animateurs),
          cancelled_at: seance.cancelled_at
            ? new Date(seance.cancelled_at)
            : null,
          nombre_places_max: seance.nombre_places_max,
          nombre_inscrits: seance.nombre_inscrits,
          url_inscription: seance.url_inscription,
        })),
      });

      return {
        motifs: { ecrits: commande.motifs.length, retires },
        seances: { ecrites },
      };
    });
  }
}
