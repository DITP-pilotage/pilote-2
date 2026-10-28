import type { $Enums, Prisma } from "@prisma/client";
import type { Inject } from "@/server/chantiers/module";
import { indicateursPubliesWhere } from "./indicateurNonAJour";

export type MissingValueFilter = "vi" | "vc" | "vi_or_vc";

export type ValeurManquante = "valeur initiale" | "valeur cible";

export type TerritoireSansViVc = {
  code: string;
  nom: string | null;
  valeursManquantes: ValeurManquante[];
};

export type MailleIndicateurSansViVc = {
  maille: $Enums.Maille;
  nbTerritoiresSansVi?: number;
  nbTerritoiresSansVc?: number;
  nbTerritoiresApplicables: number;
  territoires?: TerritoireSansViVc[];
};

export type IndicateurSansViVc = {
  id: string;
  nom: string;
  mailles: MailleIndicateurSansViVc[];
};

export type ChantierIndicateursSansViVc = {
  chantier: { id: string; nom: string };
  indicateurs: IndicateurSansViVc[];
};

type MailleSansViVc = {
  indicateurId: string;
  maille: $Enums.Maille;
  nbTerritoiresSansVi: number;
  nbTerritoiresSansVc: number;
  territoires: TerritoireSansViVc[];
};

const MAILLES_ORDER: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

const indicateurMailleKey = (indicateurId: string, maille: $Enums.Maille) =>
  `${indicateurId}|${maille}`;

const sansViWhere: Prisma.indicateur_territoireWhereInput = {
  valeur_initiale: null,
};

const sansVcWhere = (
  jalon: number,
): Prisma.indicateur_territoireWhereInput => ({
  indicateur_territoire_jalon: { some: { jalon, valeur_cible: null } },
});

export class GetIndicateursSansViVcQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCodes: string[];
    indicateurIds?: string[];
    jalon: number;
    missing: MissingValueFilter;
    withTerritoiresDetail: boolean;
  }): Promise<ChantierIndicateursSansViVc[]> {
    const prisma = this.deps.prisma.getInstance();

    const withVi = params.missing !== "vc";
    const withVc = params.missing !== "vi";

    const scopeWhere: Prisma.indicateur_territoireWhereInput = {
      ...indicateursPubliesWhere({
        chantierIds: params.chantierIds,
        territoireCodes: params.territoireCodes,
        indicateurIds: params.indicateurIds,
      }),
      est_applicable: true,
    };

    const rows = await prisma.indicateur_territoire.findMany({
      where: {
        AND: [
          scopeWhere,
          {
            OR: [
              ...(withVi ? [sansViWhere] : []),
              ...(withVc ? [sansVcWhere(params.jalon)] : []),
            ],
          },
        ],
      },
      select: {
        id: true,
        maille: true,
        territoire_code: true,
        territoire_nom: true,
        valeur_initiale: true,
        indicateur_territoire_jalon: {
          where: { jalon: params.jalon },
          select: { valeur_cible: true },
        },
      },
      orderBy: { territoire_code: "asc" },
    });

    if (rows.length === 0) return [];

    const mailles = new Map<string, MailleSansViVc>();
    for (const row of rows) {
      const sansVi = withVi && row.valeur_initiale === null;
      const sansVc =
        withVc &&
        row.indicateur_territoire_jalon.some(
          (jalon) => jalon.valeur_cible === null,
        );

      const key = indicateurMailleKey(row.id, row.maille);
      const maille = mailles.get(key) ?? {
        indicateurId: row.id,
        maille: row.maille,
        nbTerritoiresSansVi: 0,
        nbTerritoiresSansVc: 0,
        territoires: [],
      };
      mailles.set(key, maille);

      if (sansVi) maille.nbTerritoiresSansVi += 1;
      if (sansVc) maille.nbTerritoiresSansVc += 1;
      maille.territoires.push({
        code: row.territoire_code,
        nom: row.territoire_nom,
        valeursManquantes: [
          ...(sansVi ? ["valeur initiale" as const] : []),
          ...(sansVc ? ["valeur cible" as const] : []),
        ],
      });
    }

    const indicateurIds = [
      ...new Set([...mailles.values()].map((maille) => maille.indicateurId)),
    ];

    const [applicableCounts, indicateurs] = await Promise.all([
      prisma.indicateur_territoire.groupBy({
        by: ["id", "maille"],
        where: { ...scopeWhere, id: { in: indicateurIds } },
        _count: { _all: true },
      }),
      prisma.indicateur_identite.findMany({
        where: { id: { in: indicateurIds } },
        include: { chantier_identite: true },
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
      mailles.values(),
      (maille) => maille.indicateurId,
    );

    const chantiers = new Map<string, ChantierIndicateursSansViVc>();
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
        mailles: (maillesParIndicateur.get(indicateur.id) ?? [])
          .toSorted(
            (left, right) =>
              MAILLES_ORDER.indexOf(left.maille) -
              MAILLES_ORDER.indexOf(right.maille),
          )
          .map(
            ({
              maille,
              nbTerritoiresSansVi,
              nbTerritoiresSansVc,
              territoires,
            }) => ({
              maille,
              ...(withVi ? { nbTerritoiresSansVi } : {}),
              ...(withVc ? { nbTerritoiresSansVc } : {}),
              nbTerritoiresApplicables:
                applicableCountByIndicateurMaille.get(
                  indicateurMailleKey(indicateur.id, maille),
                ) ?? 0,
              ...(params.withTerritoiresDetail ? { territoires } : {}),
            }),
          ),
      });
    }

    return [...chantiers.values()];
  }
}
