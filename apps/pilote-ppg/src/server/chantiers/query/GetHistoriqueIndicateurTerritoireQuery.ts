import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { regrouperEvenementsParDate } from "@/server/indicateur-territoire-valeur-evenement/domain/historiqueEvenements";
import { libelleEvenementIndicateurTerritoireValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/libelleEvenementIndicateurTerritoireValeur";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { toISODate, toISODateTime } from "@/server/app/domain/Dates";
import { formaterDate } from "@/client/utils/date/date";

export type EvenementHistoriqueLisible = {
  ordre: number;
  date_creation: string;
  description: string | null;
  resultat: string | null;
};

export type GroupeHistoriqueIndicateur = {
  date_valeur: string;
  evenements: EvenementHistoriqueLisible[];
};

export type HistoriqueIndicateurTerritoireResult = {
  nombreEvenements: number;
  dateMin: string | null;
  dateMax: string | null;
  groupes: GroupeHistoriqueIndicateur[];
};

export class GetHistoriqueIndicateurTerritoireQuery {
  constructor(
    private readonly deps: {
      indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
    },
  ) {}

  async execute(params: {
    indicId: string;
    territoireCode: string;
    dateDebut?: Date;
    dateFin?: Date;
    typesEvenement?: readonly TypeEvenement[];
  }): Promise<HistoriqueIndicateurTerritoireResult> {
    const evenements =
      await this.deps.indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode(
        params,
      );

    const datesValeur = evenements.map((evenement) =>
      evenement.dateValeur.getTime(),
    );
    const dateMin = datesValeur.length
      ? toISODate(new Date(Math.min(...datesValeur)))
      : null;
    const dateMax = datesValeur.length
      ? toISODate(new Date(Math.max(...datesValeur)))
      : null;

    const groupes = regrouperEvenementsParDate(evenements).map(
      ({ dateValeur, evenements: evenementsDuJour }) => ({
        date_valeur: formaterDate(dateValeur, "MM/YYYY")!,
        evenements: evenementsDuJour.map(
          (evenement): EvenementHistoriqueLisible => {
            const dateCreationIso = toISODateTime(evenement.dateCreation);
            const { description, resultat } =
              libelleEvenementIndicateurTerritoireValeur(
                evenement.typeEvenement,
                evenement.valeur ?? null,
              );

            return {
              ordre: evenement.ordre,
              date_creation: formaterDate(
                dateCreationIso,
                "DD/MM/YYYY HH[:]mm",
              )!,
              description,
              resultat,
            };
          },
        ),
      }),
    );

    return {
      nombreEvenements: evenements.length,
      dateMin,
      dateMax,
      groupes,
    };
  }
}
