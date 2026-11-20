import type { Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { toISODate } from "@/server/app/domain/Dates";
import {
  statutPeriode,
  type StatutPeriode,
} from "@/server/formations/domain/periodeInformation";
import type { Inject } from "@/server/formations/module";

export interface PeriodeInformation {
  id: string;
  dateDebut: string;
  dateFin: string;
  statut: StatutPeriode;
  motifs: { id: number; nom: string; retiree: boolean }[];
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
  aujourdhui: string,
): PeriodeInformation {
  const dateDebut = toISODate(periode.date_debut);
  const dateFin = toISODate(periode.date_fin);
  return {
    id: periode.id,
    dateDebut,
    dateFin,
    statut: statutPeriode(
      { dateDebut, dateFin, supprimee: periode.deleted_at !== null },
      aujourdhui,
    ),
    motifs: periode.motifs
      .map(({ motif }) => ({
        id: Number(motif.id),
        nom: motif.nom,
        retiree: motif.deleted_at !== null,
      }))
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
    const aujourdhui = toISODate(maintenant);

    const [periodes, motifs, seancesAVenir] = await Promise.all([
      client.formation_periode_information.findMany({
        include: { motifs: { include: { motif: true } } },
        orderBy: { date_debut: "desc" },
      }),
      client.formation_motif.findMany({
        where: { deleted_at: null },
        orderBy: { nom: "asc" },
      }),
      client.formation_seance.findMany({
        where: { date_debut: { gt: maintenant }, cancelled_at: null },
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
