import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { filtrerEvenementsSupersedes } from "@/server/indicateur-territoire-valeur-evenement/domain/filtrerEvenementsSupersedes";
import { libelleEvenementIndicateurTerritoireValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/libelleEvenementIndicateurTerritoireValeur";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { toISODate, toISODateTime } from "@/server/app/domain/Dates";
import { formaterDate } from "@/client/utils/date/date";

export type EvenementHistoriqueLisible = {
  ordre: number;
  date_creation: string;
  libelle: string;
  type_valeur: string;
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

function construireLibelleLisible(
  evenement: IndicateurTerritoireValeurEvenement,
): string {
  const { description, resultat } = libelleEvenementIndicateurTerritoireValeur(
    evenement.typeEvenement,
    evenement.valeur ?? null,
  );

  return [description, resultat ? `→ ${resultat}` : null]
    .filter((partie): partie is string => Boolean(partie))
    .join(" ");
}

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

    const evenementsParDate = new Map<
      string,
      IndicateurTerritoireValeurEvenement[]
    >();
    evenements.forEach((evenement) => {
      const dateKey = toISODate(evenement.dateValeur);
      const groupe = evenementsParDate.get(dateKey) ?? [];
      groupe.push(evenement);
      evenementsParDate.set(dateKey, groupe);
    });

    const groupes = Array.from(evenementsParDate.entries())
      .sort(([dateA], [dateB]) => (dateA < dateB ? 1 : -1))
      .map(([dateValeur, evenementsDuJour]) => {
        const evenementsDuJourTriesDesc = [...evenementsDuJour].sort(
          (a, b) => b.ordre - a.ordre,
        );
        const evenementsRestants = filtrerEvenementsSupersedes(
          evenementsDuJourTriesDesc,
        ).sort((a, b) => a.ordre - b.ordre);

        return {
          date_valeur: formaterDate(dateValeur, "MM/YYYY") ?? dateValeur,
          evenements: evenementsRestants.map(
            (evenement): EvenementHistoriqueLisible => ({
              ordre: evenement.ordre,
              date_creation:
                formaterDate(
                  toISODateTime(evenement.dateCreation),
                  "DD/MM/YYYY HH[:]mm",
                ) ?? toISODateTime(evenement.dateCreation),
              libelle: construireLibelleLisible(evenement),
              type_valeur: evenement.typeValeur,
            }),
          ),
        };
      });

    return {
      nombreEvenements: evenements.length,
      dateMin,
      dateMax,
      groupes,
    };
  }
}
