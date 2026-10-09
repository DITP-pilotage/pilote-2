import type { $Enums, Prisma } from "@prisma/client";
import type { Inject } from "@/server/chantiers/module";
import { toISODate } from "@/server/app/domain/Dates";

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

type MailleEnRetard = {
  indicateurId: string;
  maille: $Enums.Maille;
  nbTerritoiresEnRetard: number;
  territoiresEnRetard?: TerritoireEnRetard[];
};

const MAILLES_ORDER: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

const indicateurMailleKey = (indicateurId: string, maille: $Enums.Maille) =>
  `${indicateurId}|${maille}`;

const formatDate = (date: Date | null) => (date ? toISODate(date) : null);

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
      chantier_id: { in: params.chantierIds },
      territoire_code: { in: params.territoireCodes },
      ...(params.indicateurIds ? { id: { in: params.indicateurIds } } : {}),
      est_applicable: true,
      indicateur_identite: {
        statut: "PUBLIE",
        chantier_identite: { statut: "PUBLIE" },
      },
    };
    const nonAJourWhere: Prisma.indicateur_territoireWhereInput = {
      ...scopeWhere,
      OR: [{ est_a_jour: false }, { est_a_jour: null }],
    };

    const maillesEnRetard = params.avecDetailTerritoires
      ? await this.recupererMaillesEnRetardDetaillees(nonAJourWhere)
      : await this.recupererMaillesEnRetardCompteurs(nonAJourWhere);

    if (maillesEnRetard.length === 0) return [];

    const indicateurIds = [
      ...new Set(maillesEnRetard.map((maille) => maille.indicateurId)),
    ];

    const [applicableCounts, indicateurs] = await Promise.all([
      prisma.indicateur_territoire.groupBy({
        by: ["id", "maille"],
        where: { ...scopeWhere, id: { in: indicateurIds } },
        _count: { _all: true },
      }),
      prisma.indicateur_identite.findMany({
        where: { id: { in: indicateurIds } },
        select: {
          id: true,
          nom: true,
          periodicite: true,
          delai_disponibilite: true,
          chantier_identite: { select: { id: true, nom: true } },
        },
        orderBy: [{ chantier_id: "asc" }, { id: "asc" }],
      }),
    ]);

    const applicableCountByIndicateurMaille = new Map(
      applicableCounts.map((count) => [
        indicateurMailleKey(count.id, count.maille),
        count._count._all,
      ]),
    );
    const maillesParIndicateur = Map.groupBy(
      maillesEnRetard,
      (maille) => maille.indicateurId,
    );

    const chantiers = new Map<string, ChantierIndicateursNonAJour>();
    for (const indicateur of indicateurs) {
      const chantierIdentite = indicateur.chantier_identite;
      const chantier = chantiers.get(chantierIdentite.id) ?? {
        chantier: { id: chantierIdentite.id, nom: chantierIdentite.nom },
        indicateurs: [],
      };
      chantiers.set(chantierIdentite.id, chantier);

      chantier.indicateurs.push({
        id: indicateur.id,
        nom: indicateur.nom,
        periodicite: indicateur.periodicite,
        delaiDisponibiliteMois: indicateur.delai_disponibilite,
        mailles: (maillesParIndicateur.get(indicateur.id) ?? [])
          .toSorted(
            (left, right) =>
              MAILLES_ORDER.indexOf(left.maille) -
              MAILLES_ORDER.indexOf(right.maille),
          )
          .map(({ maille, nbTerritoiresEnRetard, territoiresEnRetard }) => ({
            maille,
            nbTerritoiresEnRetard,
            nbTerritoiresApplicables:
              applicableCountByIndicateurMaille.get(
                indicateurMailleKey(indicateur.id, maille),
              ) ?? 0,
            ...(territoiresEnRetard ? { territoiresEnRetard } : {}),
          })),
      });
    }

    return [...chantiers.values()];
  }

  private async recupererMaillesEnRetardCompteurs(
    where: Prisma.indicateur_territoireWhereInput,
  ): Promise<MailleEnRetard[]> {
    const counts = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.groupBy({
        by: ["id", "maille"],
        where,
        _count: { _all: true },
      });

    return counts.map((count) => ({
      indicateurId: count.id,
      maille: count.maille,
      nbTerritoiresEnRetard: count._count._all,
    }));
  }

  private async recupererMaillesEnRetardDetaillees(
    where: Prisma.indicateur_territoireWhereInput,
  ): Promise<MailleEnRetard[]> {
    const rows = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where,
        select: {
          id: true,
          maille: true,
          territoire_code: true,
          territoire_nom: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
        },
        orderBy: { territoire_code: "asc" },
      });

    const mailles = new Map<string, Required<MailleEnRetard>>();
    for (const row of rows) {
      const key = indicateurMailleKey(row.id, row.maille);
      const maille = mailles.get(key) ?? {
        indicateurId: row.id,
        maille: row.maille,
        nbTerritoiresEnRetard: 0,
        territoiresEnRetard: [],
      };
      mailles.set(key, maille);

      maille.nbTerritoiresEnRetard += 1;
      maille.territoiresEnRetard.push({
        code: row.territoire_code,
        nom: row.territoire_nom,
        dateDerniereValeur: formatDate(row.date_valeur_actuelle_mandat),
        miseAJourAttendueDepuis: formatDate(row.prochaine_date_maj),
      });
    }

    return [...mailles.values()];
  }
}
