import type { $Enums, Prisma } from "@prisma/client";
import type { Inject } from "@/server/chantiers/module";

export type TerritoireEnRetard = {
  code: string;
  nom: string | null;
  dateDerniereValeur: string | null;
  miseAJourAttendueDepuis: string | null;
};

export type MailleIndicateurNonAJour = {
  maille: $Enums.Maille;
  nbTerritoiresEnRetard: number;
  nbTerritoiresApplicables: number;
  territoiresEnRetard?: TerritoireEnRetard[];
};

export type IndicateurNonAJour = {
  id: string;
  nom: string;
  periodicite: string | null;
  delaiDisponibiliteMois: number | null;
  mailles: MailleIndicateurNonAJour[];
};

export type ChantierIndicateursNonAJour = {
  chantier: { id: string; nom: string };
  indicateurs: IndicateurNonAJour[];
};

const MAILLES_ORDER: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

const formatDate = (date: Date | null) =>
  date ? date.toISOString().slice(0, 10) : null;

const indicateurMailleKey = (indicateurId: string, maille: $Enums.Maille) =>
  `${indicateurId}|${maille}`;

export class RecupererIndicateursNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCodes: string[];
    indicateurIds?: string[];
    avecDetailTerritoires: boolean;
  }): Promise<ChantierIndicateursNonAJour[]> {
    const prisma = this.deps.prisma.getInstance();

    const scopeWhere: Prisma.indicateur_territoireWhereInput = {
      territoire_code: { in: params.territoireCodes },
      ...(params.indicateurIds ? { id: { in: params.indicateurIds } } : {}),
      est_applicable: true,
      indicateur_identite: {
        chantier_id: { in: params.chantierIds },
        statut: "PUBLIE",
        chantier_identite: { statut: "PUBLIE" },
      },
    };

    const [applicableCounts, rowsNonAJour] = await Promise.all([
      prisma.indicateur_territoire.groupBy({
        by: ["id", "maille"],
        where: scopeWhere,
        _count: { _all: true },
      }),
      prisma.indicateur_territoire.findMany({
        where: {
          ...scopeWhere,
          OR: [{ est_a_jour: false }, { est_a_jour: null }],
        },
        select: {
          maille: true,
          territoire_code: true,
          territoire_nom: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
          indicateur_identite: {
            select: {
              id: true,
              nom: true,
              periodicite: true,
              delai_disponibilite: true,
              chantier_identite: { select: { id: true, nom: true } },
            },
          },
        },
        orderBy: [
          { chantier_id: "asc" },
          { id: "asc" },
          { territoire_code: "asc" },
        ],
      }),
    ]);

    const applicableCountByIndicateurMaille = new Map(
      applicableCounts.map((count) => [
        indicateurMailleKey(count.id, count.maille),
        count._count._all,
      ]),
    );

    const chantiers = new Map<string, ChantierIndicateursNonAJour>();

    for (const row of rowsNonAJour) {
      const indicateurIdentite = row.indicateur_identite;
      const chantierIdentite = indicateurIdentite.chantier_identite;

      if (!chantiers.has(chantierIdentite.id)) {
        chantiers.set(chantierIdentite.id, {
          chantier: { id: chantierIdentite.id, nom: chantierIdentite.nom },
          indicateurs: [],
        });
      }
      const chantier = chantiers.get(chantierIdentite.id)!;

      let indicateur = chantier.indicateurs.find(
        (existing) => existing.id === indicateurIdentite.id,
      );
      if (!indicateur) {
        indicateur = {
          id: indicateurIdentite.id,
          nom: indicateurIdentite.nom,
          periodicite: indicateurIdentite.periodicite,
          delaiDisponibiliteMois: indicateurIdentite.delai_disponibilite,
          mailles: [],
        };
        chantier.indicateurs.push(indicateur);
      }

      let maille = indicateur.mailles.find(
        (existing) => existing.maille === row.maille,
      );
      if (!maille) {
        maille = {
          maille: row.maille,
          nbTerritoiresEnRetard: 0,
          nbTerritoiresApplicables:
            applicableCountByIndicateurMaille.get(
              indicateurMailleKey(indicateurIdentite.id, row.maille),
            ) ?? 0,
          ...(params.avecDetailTerritoires ? { territoiresEnRetard: [] } : {}),
        };
        indicateur.mailles.push(maille);
      }

      maille.nbTerritoiresEnRetard += 1;
      maille.territoiresEnRetard?.push({
        code: row.territoire_code,
        nom: row.territoire_nom,
        dateDerniereValeur: formatDate(row.date_valeur_actuelle_mandat),
        miseAJourAttendueDepuis: formatDate(row.prochaine_date_maj),
      });
    }

    for (const chantier of chantiers.values()) {
      for (const indicateur of chantier.indicateurs) {
        indicateur.mailles.sort(
          (left, right) =>
            MAILLES_ORDER.indexOf(left.maille) -
            MAILLES_ORDER.indexOf(right.maille),
        );
      }
    }

    return [...chantiers.values()];
  }
}
