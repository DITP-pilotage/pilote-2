import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import { Chantier } from "@/shared/chantier/Chantier.interface";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/shared/maille/Maille.interface";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { CODES_MAILLES } from "@/shared/maille/mailleSQLParser";
import { calculerMediane } from "@/client/utils/statistiques/statistiques";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import type { Inject } from "@/server/chantiers/module";

type TerritoireAverage = {
  territoire_code: string;
  _avg: { taux_avancement: number | null };
};

export function computeAvancementStatistiques(
  territoireAverages: TerritoireAverage[],
): AvancementsStatistiques {
  const sortedValues = territoireAverages
    .map((territoireAverage) => territoireAverage._avg.taux_avancement)
    .toSorted((a, b) => (a ?? 0) - (b ?? 0));
  return {
    médiane: calculerMediane(sortedValues),
    minimum: verifyValeurIsNotNullOrUndefined(sortedValues.at(0)),
    maximum: verifyValeurIsNotNullOrUndefined(sortedValues.at(-1)),
  };
}

export function computeAvancementStatistiquesByChantier(
  rows: (TerritoireAverage & { id: string })[],
  chantierIds: Chantier["id"][],
): Record<Chantier["id"], AvancementsStatistiques> {
  const rowsByChantier = new Map<Chantier["id"], TerritoireAverage[]>();
  for (const row of rows) {
    const chantierRows = rowsByChantier.get(row.id) ?? [];
    chantierRows.push(row);
    rowsByChantier.set(row.id, chantierRows);
  }
  return Object.fromEntries(
    chantierIds.map((chantierId) => [
      chantierId,
      computeAvancementStatistiques(rowsByChantier.get(chantierId) ?? []),
    ]),
  );
}

export class GetStatistiquesAvancementChantiersQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    habilitations: Habilitations;
    listeChantier: Chantier["id"][];
    maille: Maille;
    jalon: number;
  }): Promise<AvancementsStatistiques> {
    const prisma = this.deps.prisma.getInstance();
    const habilitation = new Habilitation(params.habilitations);
    const chantiersAutorisés =
      habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = params.listeChantier.filter((chantier) =>
      chantiersAutorisés.includes(chantier),
    );

    const listeMoyenneParTerritoire =
      await prisma.chantier_territoire_jalon.groupBy({
        by: ["territoire_code"],
        _avg: {
          taux_avancement: true,
        },
        where: {
          id: {
            in: chantiersLecture,
          },
          jalon: params.jalon,
          maille: CODES_MAILLES[params.maille],
          NOT: {
            taux_avancement: {
              equals: null,
            },
          },
        },
        orderBy: {
          _avg: {
            taux_avancement: "asc",
          },
        },
      });

    return computeAvancementStatistiques(listeMoyenneParTerritoire);
  }

  async executeByChantier(params: {
    habilitations: Habilitations;
    listeChantier: Chantier["id"][];
    maille: Maille;
    jalon: number;
  }): Promise<Record<Chantier["id"], AvancementsStatistiques>> {
    const prisma = this.deps.prisma.getInstance();
    const chantiersAutorisés = new Habilitation(
      params.habilitations,
    ).récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = params.listeChantier.filter((chantier) =>
      chantiersAutorisés.includes(chantier),
    );

    const rows = await prisma.chantier_territoire_jalon.groupBy({
      by: ["id", "territoire_code"],
      _avg: {
        taux_avancement: true,
      },
      where: {
        id: {
          in: chantiersLecture,
        },
        jalon: params.jalon,
        maille: CODES_MAILLES[params.maille],
        NOT: {
          taux_avancement: {
            equals: null,
          },
        },
      },
    });

    return computeAvancementStatistiquesByChantier(rows, chantiersLecture);
  }
}
