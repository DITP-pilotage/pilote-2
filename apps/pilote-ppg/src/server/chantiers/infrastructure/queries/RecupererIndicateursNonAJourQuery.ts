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
  nbTerritoiresApplicables: number;
  territoiresEnRetard: TerritoireEnRetard[];
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

export type RecupererIndicateursNonAJourResult = {
  chantiers: ChantierIndicateursNonAJour[];
  indicateursApplicablesIds: string[];
};

const ORDRE_MAILLES: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

const formaterDate = (date: Date | null) =>
  date ? date.toISOString().slice(0, 10) : null;

const cleIndicateurMaille = (indicateurId: string, maille: $Enums.Maille) =>
  `${indicateurId}|${maille}`;

export class RecupererIndicateursNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCodes: string[];
    indicateurIds?: string[];
  }): Promise<RecupererIndicateursNonAJourResult> {
    const prisma = this.deps.prisma.getInstance();

    const perimetre: Prisma.indicateur_territoireWhereInput = {
      territoire_code: { in: params.territoireCodes },
      ...(params.indicateurIds ? { id: { in: params.indicateurIds } } : {}),
      est_applicable: true,
      indicateur_identite: {
        chantier_id: { in: params.chantierIds },
        statut: "PUBLIE",
        chantier_identite: { statut: "PUBLIE" },
      },
    };

    const [comptesApplicables, lignesEnRetard] = await Promise.all([
      prisma.indicateur_territoire.groupBy({
        by: ["id", "maille"],
        where: perimetre,
        _count: { _all: true },
      }),
      prisma.indicateur_territoire.findMany({
        where: {
          ...perimetre,
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

    const nbApplicablesParIndicateurMaille = new Map(
      comptesApplicables.map((compte) => [
        cleIndicateurMaille(compte.id, compte.maille),
        compte._count._all,
      ]),
    );

    const chantiers = new Map<string, ChantierIndicateursNonAJour>();

    for (const ligne of lignesEnRetard) {
      const indicateurIdentite = ligne.indicateur_identite;
      const chantierIdentite = indicateurIdentite.chantier_identite;

      if (!chantiers.has(chantierIdentite.id)) {
        chantiers.set(chantierIdentite.id, {
          chantier: { id: chantierIdentite.id, nom: chantierIdentite.nom },
          indicateurs: [],
        });
      }
      const chantier = chantiers.get(chantierIdentite.id)!;

      let indicateur = chantier.indicateurs.find(
        (existant) => existant.id === indicateurIdentite.id,
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
        (existante) => existante.maille === ligne.maille,
      );
      if (!maille) {
        maille = {
          maille: ligne.maille,
          nbTerritoiresApplicables:
            nbApplicablesParIndicateurMaille.get(
              cleIndicateurMaille(indicateurIdentite.id, ligne.maille),
            ) ?? 0,
          territoiresEnRetard: [],
        };
        indicateur.mailles.push(maille);
      }

      maille.territoiresEnRetard.push({
        code: ligne.territoire_code,
        nom: ligne.territoire_nom,
        dateDerniereValeur: formaterDate(ligne.date_valeur_actuelle_mandat),
        miseAJourAttendueDepuis: formaterDate(ligne.prochaine_date_maj),
      });
    }

    for (const chantier of chantiers.values()) {
      for (const indicateur of chantier.indicateurs) {
        indicateur.mailles.sort(
          (gauche, droite) =>
            ORDRE_MAILLES.indexOf(gauche.maille) -
            ORDRE_MAILLES.indexOf(droite.maille),
        );
      }
    }

    return {
      chantiers: [...chantiers.values()],
      indicateursApplicablesIds: [
        ...new Set(comptesApplicables.map((compte) => compte.id)),
      ].sort(),
    };
  }
}
