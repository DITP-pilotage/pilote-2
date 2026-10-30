import type { $Enums } from "@prisma/client";
import type { Inject } from "@/server/chantiers/module";
import { toISODate } from "@/server/app/domain/Dates";
import {
  NON_A_JOUR_WHERE,
  indicateursPubliesWhere,
} from "./indicateurNonAJour";

export type LigneIndicateurNonAJour = {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  indicateurNom: string;
  periodicite: string | null;
  delaiDisponibiliteMois: number | null;
  maille: $Enums.Maille;
  territoireCode: string;
  territoireNom: string | null;
  dateDerniereValeur: string | null;
  miseAJourAttendueDepuis: string | null;
};

export class GetIndicateursNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCodes: string[];
    indicateurIds?: string[];
  }): Promise<LigneIndicateurNonAJour[]> {
    const lignes = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where: { AND: [indicateursPubliesWhere(params), NON_A_JOUR_WHERE] },
        orderBy: [
          { chantier_id: "asc" },
          { id: "asc" },
          { territoire_code: "asc" },
        ],
        select: {
          id: true,
          maille: true,
          territoire_code: true,
          territoire_nom: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
          indicateur_identite: {
            select: {
              nom: true,
              periodicite: true,
              delai_disponibilite: true,
              chantier_identite: { select: { id: true, nom: true } },
            },
          },
        },
      });

    return lignes.map((ligne) => ({
      chantierId: ligne.indicateur_identite.chantier_identite.id,
      chantierNom: ligne.indicateur_identite.chantier_identite.nom,
      indicateurId: ligne.id,
      indicateurNom: ligne.indicateur_identite.nom,
      periodicite: ligne.indicateur_identite.periodicite,
      delaiDisponibiliteMois: ligne.indicateur_identite.delai_disponibilite,
      maille: ligne.maille,
      territoireCode: ligne.territoire_code,
      territoireNom: ligne.territoire_nom,
      dateDerniereValeur: ligne.date_valeur_actuelle_mandat
        ? toISODate(ligne.date_valeur_actuelle_mandat)
        : null,
      miseAJourAttendueDepuis: ligne.prochaine_date_maj
        ? toISODate(ligne.prochaine_date_maj)
        : null,
    }));
  }
}
