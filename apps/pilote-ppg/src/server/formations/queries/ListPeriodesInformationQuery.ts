import type { Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import {
  aujourdhuiAParis,
  jourISO,
  statutPeriode,
  type JourISO,
  type StatutPeriode,
} from "@/server/formations/domain/periodeInformation";
import type { Inject } from "@/server/formations/module";

export interface PeriodeInformation {
  id: string;
  dateDebut: JourISO;
  dateFin: JourISO;
  statut: StatutPeriode;
  motifs: { id: number; nom: string }[];
}

export interface MotifDisponible {
  id: number;
  nom: string;
  aDesSeancesAVenir: boolean;
}

export interface PeriodesInformation {
  periodes: PeriodeInformation[];
  motifsDisponibles: MotifDisponible[];
}

type PeriodeAvecMotifs = Prisma.formation_periode_informationGetPayload<{
  include: { motifs: { include: { motif: true } } };
}>;

function toApiModel(
  periode: PeriodeAvecMotifs,
  aujourdhui: JourISO,
): PeriodeInformation {
  const dateDebut = jourISO(periode.date_debut);
  const dateFin = jourISO(periode.date_fin);
  return {
    id: periode.id,
    dateDebut,
    dateFin,
    statut: statutPeriode(
      { dateDebut, dateFin, supprimee: periode.deleted_at !== null },
      aujourdhui,
    ),
    motifs: periode.motifs
      .map(({ motif }) => ({ id: Number(motif.id), nom: motif.nom }))
      .sort((premier, second) => premier.nom.localeCompare(second.nom, "fr")),
  };
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
        include: { motifs: { include: { motif: true } } },
        orderBy: { date_debut: "desc" },
      }),
      client.formation_motif.findMany({
        where: { date_suppression: null },
        orderBy: { nom: "asc" },
      }),
      client.formation_seance.findMany({
        where: { date_debut: { gt: maintenant }, date_annulation: null },
        select: { motif_id: true },
        distinct: ["motif_id"],
      }),
    ]);

    const motifsAvecSeances = new Set(
      seancesAVenir.map((seance) => Number(seance.motif_id)),
    );

    return {
      periodes: periodes.map((periode) => toApiModel(periode, aujourdhui)),
      motifsDisponibles: motifs.map((motif) => ({
        id: Number(motif.id),
        nom: motif.nom,
        aDesSeancesAVenir: motifsAvecSeances.has(Number(motif.id)),
      })),
    };
  }
}
