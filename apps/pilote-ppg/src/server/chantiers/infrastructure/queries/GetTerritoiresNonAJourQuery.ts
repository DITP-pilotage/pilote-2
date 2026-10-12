import type { $Enums } from "@prisma/client";
import type { Inject } from "@/server/chantiers/module";
import {
  estNonAJour,
  formatDate,
  perimetreIndicateursPubliesWhere,
} from "./indicateurNonAJour";

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

const MAP_MAILLES: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

export class GetTerritoiresNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async byChantier(params: {
    chantierId: string;
  }): Promise<TerritoireNonAJourChantierViewModel[]> {
    const rows = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where: perimetreIndicateursPubliesWhere({
          chantierIds: [params.chantierId],
          mailles: MAP_MAILLES,
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
        where: perimetreIndicateursPubliesWhere({
          chantierIds: [params.chantierId],
          indicateurIds: [params.indicateurId],
          mailles: MAP_MAILLES,
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
      dateDerniereValeur: formatDate(row.date_valeur_actuelle_mandat),
      miseAJourAttendueDepuis: formatDate(row.prochaine_date_maj),
    }));
  }
}
