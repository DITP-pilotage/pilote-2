import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type EvenementVADTO = {
  id: string;
  indicateurId: string;
  indicateurNom: string;
  territoireCode: string;
  territoireNom: string;
  typeEvenement: "VALEUR_CREEE" | "VALEUR_MODIFIEE" | "VALEUR_HISTORISEE";
  dateValeur: Date;
  valeur: number | null;
  dateCreation: Date;
  ordre: number;
};

const TYPES_EVENEMENTS_VA: $Enums.type_evenement[] = [
  "VALEUR_CREEE",
  "VALEUR_MODIFIEE",
  "VALEUR_HISTORISEE",
];

export class RecupererEvenementsVAParPeriodeQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async recupererDansPeriode(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    dateDebut: Date;
    dateFin: Date;
  }): Promise<EvenementVADTO[]> {
    if (
      params.indicateurIds.length === 0 ||
      params.territoireCodes.length === 0
    ) {
      return [];
    }

    const prisma = this.deps.prisma.getInstance();

    const rows = await prisma.indicateur_territoire_valeur_evenement.findMany({
      where: {
        indic_id: { in: params.indicateurIds },
        territoire_code: { in: params.territoireCodes },
        type_evenement: { in: TYPES_EVENEMENTS_VA },
        type_valeur: "VALEUR_AVANCEMENT",
        date_creation: {
          gte: params.dateDebut,
          lte: params.dateFin,
        },
      },
      include: {
        indicateur_territoire: {
          select: {
            indicateur_identite: {
              select: {
                nom: true,
              },
            },
            territoire: {
              select: {
                nom: true,
              },
            },
          },
        },
      },
      orderBy: [{ date_creation: "desc" }, { ordre: "desc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      indicateurId: row.indic_id,
      indicateurNom: row.indicateur_territoire.indicateur_identite.nom,
      territoireCode: row.territoire_code,
      territoireNom: row.indicateur_territoire.territoire.nom,
      typeEvenement: row.type_evenement as EvenementVADTO["typeEvenement"],
      dateValeur: row.date_valeur,
      valeur: row.valeur,
      dateCreation: row.date_creation,
      ordre: row.ordre,
    }));
  }

  async recupererDernierAvantDate(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    dateAvant: Date;
  }): Promise<EvenementVADTO[]> {
    if (
      params.indicateurIds.length === 0 ||
      params.territoireCodes.length === 0
    ) {
      return [];
    }

    const prisma = this.deps.prisma.getInstance();

    const rows = await prisma.indicateur_territoire_valeur_evenement.findMany({
      where: {
        indic_id: { in: params.indicateurIds },
        territoire_code: { in: params.territoireCodes },
        type_evenement: { in: TYPES_EVENEMENTS_VA },
        type_valeur: "VALEUR_AVANCEMENT",
        date_creation: { lt: params.dateAvant },
      },
      include: {
        indicateur_territoire: {
          select: {
            indicateur_identite: {
              select: {
                nom: true,
              },
            },
            territoire: {
              select: {
                nom: true,
              },
            },
          },
        },
      },
      orderBy: [{ date_creation: "desc" }, { ordre: "desc" }],
    });

    const grouped = new Map<string, EvenementVADTO>();
    for (const row of rows) {
      const key = `${row.indic_id}|${row.territoire_code}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: row.id,
          indicateurId: row.indic_id,
          indicateurNom: row.indicateur_territoire.indicateur_identite.nom,
          territoireCode: row.territoire_code,
          territoireNom: row.indicateur_territoire.territoire.nom,
          typeEvenement: row.type_evenement as EvenementVADTO["typeEvenement"],
          dateValeur: row.date_valeur,
          valeur: row.valeur,
          dateCreation: row.date_creation,
          ordre: row.ordre,
        });
      }
    }

    return Array.from(grouped.values());
  }
}
