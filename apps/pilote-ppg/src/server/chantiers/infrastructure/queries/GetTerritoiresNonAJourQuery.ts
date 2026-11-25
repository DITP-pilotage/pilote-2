import type { Inject } from "@/server/chantiers/module";
import { toISODate } from "@/server/app/domain/Dates";
import {
  EtatMiseAJour,
  etatMiseAJour,
  etatTerritoireChantier,
  indicateursPubliesWhere,
} from "./indicateurNonAJour";

export type TerritoireNonAJourChantierViewModel = {
  territoireCode: string;
  etat: EtatMiseAJour;
  nbIndicateursNonAJour: number;
  nbIndicateursSansDonnee: number;
};

export type TerritoireNonAJourIndicateurViewModel = {
  territoireCode: string;
  etat: EtatMiseAJour;
  dateDerniereValeur: string | null;
  miseAJourAttendueDepuis: string | null;
};

const derniereValeurSelect = {
  orderBy: { jalon: "desc" },
  take: 1,
  select: { date_valeur_actuelle: true },
} as const;

const etatLigne = (ligne: {
  est_applicable: boolean | null;
  est_a_jour: boolean | null;
  indicateur_territoire_jalon: { date_valeur_actuelle: Date | null }[];
}) =>
  etatMiseAJour({
    estApplicable: ligne.est_applicable,
    estAJour: ligne.est_a_jour,
    dateDerniereValeur: dateDerniereValeur(ligne),
  });

const dateDerniereValeur = (ligne: {
  indicateur_territoire_jalon: { date_valeur_actuelle: Date | null }[];
}) => ligne.indicateur_territoire_jalon.at(0)?.date_valeur_actuelle ?? null;

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
          indicateur_territoire_jalon: derniereValeurSelect,
        },
      });

    const territoires = new Map<
      string,
      {
        estApplicable: boolean;
        nbIndicateursNonAJour: number;
        nbIndicateursSansDonnee: number;
      }
    >();
    for (const row of rows) {
      const territoire = territoires.get(row.territoire_code) ?? {
        estApplicable: false,
        nbIndicateursNonAJour: 0,
        nbIndicateursSansDonnee: 0,
      };
      territoires.set(row.territoire_code, territoire);

      const etat = etatLigne(row);
      if (etat !== "NON_APPLICABLE") territoire.estApplicable = true;
      if (etat === "NON_A_JOUR") territoire.nbIndicateursNonAJour += 1;
      if (etat === "SANS_DONNEE") territoire.nbIndicateursSansDonnee += 1;
    }

    return [...territoires.entries()].map(([territoireCode, territoire]) => ({
      territoireCode,
      etat: etatTerritoireChantier(territoire),
      nbIndicateursNonAJour: territoire.nbIndicateursNonAJour,
      nbIndicateursSansDonnee: territoire.nbIndicateursSansDonnee,
    }));
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
          prochaine_date_maj: true,
          indicateur_territoire_jalon: derniereValeurSelect,
        },
      });

    return rows.map((row) => {
      const date = dateDerniereValeur(row);
      return {
        territoireCode: row.territoire_code,
        etat: etatLigne(row),
        dateDerniereValeur: date ? toISODate(date) : null,
        miseAJourAttendueDepuis: row.prochaine_date_maj
          ? toISODate(row.prochaine_date_maj)
          : null,
      };
    });
  }
}
