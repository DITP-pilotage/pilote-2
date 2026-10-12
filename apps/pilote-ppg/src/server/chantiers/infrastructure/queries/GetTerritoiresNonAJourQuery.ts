import type { Inject } from "@/server/chantiers/module";
import { toISODate } from "@/server/app/domain/Dates";
import { estNonAJour, indicateursPubliesWhere } from "./indicateurNonAJour";

export type TerritoireNonAJourChantierViewModel = {
  territoireCode: string;
  estApplicable: boolean;
  nbIndicateursNonAJour: number;
};

export type TerritoireNonAJourIndicateurViewModel = {
  territoireCode: string;
  estApplicable: boolean;
  estAJour: boolean;
  dateDerniereValeur: string | null;
  miseAJourAttendueDepuis: string | null;
};

export class GetTerritoiresNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async byChantier(params: {
    chantierId: string;
  }): Promise<TerritoireNonAJourChantierViewModel[]> {
    const rows = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where: indicateursPubliesWhere({
          chantierIds: [params.chantierId],
        }),
        select: {
          territoire_code: true,
          est_applicable: true,
          est_a_jour: true,
        },
      });

    const territoires = new Map<string, TerritoireNonAJourChantierViewModel>();
    for (const row of rows) {
      const territoire = territoires.get(row.territoire_code) ?? {
        territoireCode: row.territoire_code,
        estApplicable: false,
        nbIndicateursNonAJour: 0,
      };
      territoires.set(row.territoire_code, territoire);

      if (row.est_applicable === true) territoire.estApplicable = true;
      if (estNonAJour(row)) territoire.nbIndicateursNonAJour += 1;
    }

    return [...territoires.values()];
  }

  async byIndicateur(params: {
    chantierId: string;
    indicateurId: string;
  }): Promise<TerritoireNonAJourIndicateurViewModel[]> {
    const rows = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where: indicateursPubliesWhere({
          chantierIds: [params.chantierId],
          indicateurIds: [params.indicateurId],
        }),
        select: {
          territoire_code: true,
          est_applicable: true,
          est_a_jour: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
        },
      });

    return rows.map((row) => ({
      territoireCode: row.territoire_code,
      estApplicable: row.est_applicable === true,
      estAJour: row.est_applicable === true && !estNonAJour(row),
      dateDerniereValeur: row.date_valeur_actuelle_mandat
        ? toISODate(row.date_valeur_actuelle_mandat)
        : null,
      miseAJourAttendueDepuis: row.prochaine_date_maj
        ? toISODate(row.prochaine_date_maj)
        : null,
    }));
  }
}
