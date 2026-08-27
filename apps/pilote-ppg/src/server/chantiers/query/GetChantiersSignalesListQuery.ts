import { Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PilotePrismaClient } from "@/server/db/PrismaTransaction";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";
import {
  categoriesSignalementDeLaMaille,
  categoriesDuChantier,
  libelleCategorieSignalement,
  type CategorieSignalement,
} from "@/server/chantiers/domain/CalculCategoriesSignalement";
import {
  chantiersSansTauxDepartemental,
  compterPva,
} from "@/server/chantiers/infrastructure/queries/RequetesCategoriesSignalement";

type ChantierTerritoireRow = {
  id: string;
  meteo: string | null;
  tendance: string | null;
  nombre_propositions_valeur_actuelle: number;
  chantier_identite: {
    id: string;
    nom: string;
    axe: string;
    ppg: string;
    ministeres_acronymes: string[];
    cible_attendue: boolean;
  };
  chantier_territoire_jalon: {
    ecart: number | null;
    taux_avancement: number | null;
  }[];
};

export type GetChantiersSignalesListParams = {
  territoireCode: string;
  chantierIds?: string[];
  categorieSignalement?: CategorieSignalement;
};

export type ChantierSignaleResult = {
  chantier: {
    id: string;
    nom: string;
    axe: string;
    ppg: string;
    ministeres: string[];
  };
  categories_signalement: string[];
  meteo: string | null;
  tendance: string | null;
  ecart: number | null;
  taux_avancement: number | null;
};

export type GetChantiersSignalesListResult = {
  territoire_code: string;
  territoire_nom: string;
  jalon: number;
  maille: string;
  chantiers: ChantierSignaleResult[];
};

export class GetChantiersSignalesListQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(
    params: GetChantiersSignalesListParams,
  ): Promise<GetChantiersSignalesListResult> {
    const prisma = this.deps.prisma.getInstance();

    const territoire = await prisma.territoire.findUniqueOrThrow({
      where: { code: params.territoireCode },
      select: { nom: true },
    });

    const { maille } = territoireCodeVersMailleCodeInsee(params.territoireCode);

    const jalonParDefaut = getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );

    const chantierTerritoires = await this.recupererChantierTerritoires(
      prisma,
      params,
      jalonParDefaut,
    );

    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);

    const categoriesRecherchees = params.categorieSignalement
      ? [params.categorieSignalement]
      : categoriesSignalementDeLaMaille(maille);

    const pvaChantierIds = categoriesRecherchees.includes(
      "proposition_valeur_avancement",
    )
      ? await compterPva(prisma, maille, chantierIdsApplicables, params)
      : new Set<string>();

    const sansTauxDeptIds = categoriesRecherchees.includes(
      "absence_taux_avancement_departemental",
    )
      ? await chantiersSansTauxDepartemental(
          prisma,
          maille,
          chantierTerritoires,
          jalonParDefaut,
        )
      : new Set<string>();

    const chantiers: ChantierSignaleResult[] = [];

    for (const ct of chantierTerritoires) {
      const categories = categoriesDuChantier(
        ct,
        maille,
        pvaChantierIds,
        sansTauxDeptIds,
      ).filter((categorie) => categoriesRecherchees.includes(categorie));

      if (categories.length === 0) continue;

      const jalonData = ct.chantier_territoire_jalon[0];

      chantiers.push({
        chantier: {
          id: ct.chantier_identite.id,
          nom: ct.chantier_identite.nom,
          axe: ct.chantier_identite.axe,
          ppg: ct.chantier_identite.ppg,
          ministeres: ct.chantier_identite.ministeres_acronymes,
        },
        categories_signalement: categories.map((categorie) =>
          libelleCategorieSignalement(categorie, maille),
        ),
        meteo: ct.meteo,
        tendance: ct.tendance,
        ecart: jalonData?.ecart ?? null,
        taux_avancement: jalonData?.taux_avancement ?? null,
      });
    }

    chantiers.sort((a, b) => a.chantier.id.localeCompare(b.chantier.id));

    return {
      territoire_code: params.territoireCode,
      territoire_nom: territoire.nom,
      jalon: jalonParDefaut,
      maille,
      chantiers,
    };
  }

  private async recupererChantierTerritoires(
    prisma: PilotePrismaClient,
    params: GetChantiersSignalesListParams,
    jalonParDefaut: number,
  ): Promise<ChantierTerritoireRow[]> {
    const chantierTerritoires = await prisma.chantier_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: {
          statut: "PUBLIE",
          NOT: { ministeres: { isEmpty: true } },
        },
        ...(params.chantierIds && params.chantierIds.length > 0
          ? { id: { in: params.chantierIds } }
          : {}),
      },
      include: {
        chantier_identite: true,
        chantier_territoire_jalon: {
          where: { jalon: jalonParDefaut },
        },
      },
    });

    return chantierTerritoires.map(toChantierTerritoireRow);
  }
}

type ChantierTerritoireAvecRelations = Prisma.chantier_territoireGetPayload<{
  include: {
    chantier_identite: true;
    chantier_territoire_jalon: true;
  };
}>;

function toChantierTerritoireRow(
  ct: ChantierTerritoireAvecRelations,
): ChantierTerritoireRow {
  return {
    id: ct.id,
    meteo: ct.meteo,
    tendance: ct.tendance,
    nombre_propositions_valeur_actuelle: ct.nombre_propositions_valeur_actuelle,
    chantier_identite: {
      id: ct.chantier_identite.id,
      nom: ct.chantier_identite.nom,
      axe: ct.chantier_identite.axe,
      ppg: ct.chantier_identite.ppg,
      ministeres_acronymes: ct.chantier_identite.ministeres_acronymes,
      cible_attendue: ct.chantier_identite.cible_attendue,
    },
    chantier_territoire_jalon: ct.chantier_territoire_jalon.map((jalon) => ({
      ecart: jalon.ecart,
      taux_avancement: jalon.taux_avancement,
    })),
  };
}
