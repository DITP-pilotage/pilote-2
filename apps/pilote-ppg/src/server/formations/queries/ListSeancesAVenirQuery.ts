import type { Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import {
  statutSeance,
  type StatutSeance,
} from "@/server/formations/domain/statutSeance";
import type { Inject } from "@/server/formations/module";

export interface SeanceAVenir {
  id: number;
  formation: string;
  dateDebut: string;
  dureeMinutes: number;
  lieu: string | null;
  animateurs: string | null;
  nombreInscrits: number;
  nombrePlacesMax: number | null;
  urlInscription: string;
  statut: StatutSeance;
}

export interface SeancesAVenir {
  dateImport: string | null;
  seances: SeanceAVenir[];
}

type SeanceAvecMotif = Prisma.formation_seanceGetPayload<{
  include: { motif: true };
}>;

function toApiModel(seance: SeanceAvecMotif): SeanceAVenir {
  return {
    id: Number(seance.id),
    formation: seance.motif.nom,
    dateDebut: seance.date_debut.toISOString(),
    dureeMinutes: seance.duree_minutes,
    lieu: seance.lieu,
    animateurs: seance.animateurs,
    nombreInscrits: seance.nombre_inscrits,
    nombrePlacesMax: seance.nombre_places_max,
    urlInscription: seance.url_inscription,
    statut: statutSeance({
      dateAnnulation: seance.date_annulation,
      nombreInscrits: seance.nombre_inscrits,
      nombrePlacesMax: seance.nombre_places_max,
    }),
  };
}

export class ListSeancesAVenirQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ maintenant }: { maintenant: Date }): Promise<SeancesAVenir> {
    const client = this.prisma.getInstance();
    // Copilot réécrit tous les motifs à chaque import, même ceux sans séance à venir :
    // leur date d'import la plus récente est celle du dernier passage.
    const [seances, dernierImport] = await Promise.all([
      client.formation_seance.findMany({
        where: { date_debut: { gt: maintenant } },
        include: { motif: true },
        orderBy: [{ date_debut: "asc" }, { id: "asc" }],
      }),
      client.formation_motif.aggregate({ _max: { date_import: true } }),
    ]);

    return {
      dateImport: dernierImport._max.date_import?.toISOString() ?? null,
      seances: seances.map(toApiModel),
    };
  }
}
