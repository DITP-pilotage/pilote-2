import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import {
  aujourdhuiAParis,
  statutPeriode,
  type JourISO,
  type StatutPeriode,
} from "@/server/formations/domain/periodeInformation";
import { bornesDepuisBase } from "@/server/formations/infrastructure/joursBase";
import type { Inject } from "@/server/formations/module";

export interface PeriodeInformation {
  id: string;
  dateDebut: JourISO;
  dateFin: JourISO;
  statut: StatutPeriode;
  // `retireeDeRdvSp` : motif supprimé dans RDV-SP ou disparu de formation_motif ;
  // il n'est plus proposé et sera enlevé de la période au prochain enregistrement.
  motifs: { id: number; nom: string | null; retireeDeRdvSp: boolean }[];
}

export interface MotifDisponible {
  id: number;
  nom: string;
  aDesSeancesAVenir: boolean;
}

export interface PeriodesInformation {
  aujourdhui: JourISO;
  periodes: PeriodeInformation[];
  motifsDisponibles: MotifDisponible[];
}

type MotifDePeriode = PeriodeInformation["motifs"][number];

// Par nom, les motifs disparus de RDV-SP (nom inconnu) en dernier.
function comparerMotifs(premier: MotifDePeriode, second: MotifDePeriode) {
  if (premier.nom === null || second.nom === null) {
    return (
      Number(premier.nom === null) - Number(second.nom === null) ||
      premier.id - second.id
    );
  }
  return premier.nom.localeCompare(second.nom, "fr") || premier.id - second.id;
}

export class ListPeriodesInformationQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    maintenant,
  }: {
    maintenant: Date;
  }): Promise<PeriodesInformation> {
    const client = this.prisma.getInstance();
    const aujourdhui = aujourdhuiAParis(maintenant);

    const [periodes, motifs, seancesAVenir] = await Promise.all([
      client.formation_periode_information.findMany({
        include: { motifs: true },
        orderBy: { date_debut: "desc" },
      }),
      client.formation_motif.findMany({ orderBy: { nom: "asc" } }),
      client.formation_seance.findMany({
        where: { date_debut: { gt: maintenant }, date_annulation: null },
        select: { motif_id: true },
        distinct: ["motif_id"],
      }),
    ]);

    const motifsParId = new Map(
      motifs.map((motif) => [Number(motif.id), motif]),
    );
    const motifsAvecSeances = new Set(
      seancesAVenir.map((seance) => Number(seance.motif_id)),
    );

    return {
      aujourdhui,
      periodes: periodes.map((periode) => {
        const bornes = bornesDepuisBase(periode);
        return {
          id: periode.id,
          ...bornes,
          statut: statutPeriode(bornes, aujourdhui),
          motifs: periode.motifs
            .map((motifDePeriode) => {
              const motifId = Number(motifDePeriode.motif_id);
              const motif = motifsParId.get(motifId);
              return {
                id: motifId,
                nom: motif?.nom ?? null,
                retireeDeRdvSp: !motif || motif.date_suppression !== null,
              };
            })
            .sort(comparerMotifs),
        };
      }),
      motifsDisponibles: motifs
        .filter((motif) => motif.date_suppression === null)
        .map((motif) => ({
          id: Number(motif.id),
          nom: motif.nom,
          aDesSeancesAVenir: motifsAvecSeances.has(Number(motif.id)),
        })),
    };
  }
}
