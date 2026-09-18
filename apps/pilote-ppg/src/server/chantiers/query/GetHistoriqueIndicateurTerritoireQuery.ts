import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { regrouperEvenementsParDate } from "@/server/indicateur-territoire-valeur-evenement/domain/historiqueEvenements";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { toISODate, toISODateTime } from "@/server/app/domain/Dates";
import { formaterDate } from "@/client/utils/date/date";

export type CategorieEvenementAlbert = "IMPORT" | "PROPOSITION";

export type EvenementHistoriqueLisible = {
  ordre: number;
  date_creation: string;
  description: string;
  categorie: CategorieEvenementAlbert;
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
            const { description, categorie } = this.descriptionEvenement(
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
              categorie,
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

  private descriptionEvenement(
    typeEvenement: TypeEvenement,
    valeur: number | null,
  ): { description: string; categorie: CategorieEvenementAlbert } {
    switch (typeEvenement) {
      case "VALEUR_CREEE":
        return {
          description: `Import direct par la direction de projet : première valeur d'avancement enregistrée pour cette date. Nouvelle valeur affichée dans PILOTE : ${valeur}.`,
          categorie: "IMPORT",
        };
      case "VALEUR_MODIFIEE":
        return {
          description:
            valeur === null
              ? "Import direct par la direction de projet : la valeur d'avancement a été supprimée de PILOTE pour cette date."
              : `Import direct par la direction de projet : la valeur d'avancement affichée dans PILOTE a été remplacée. Nouvelle valeur affichée dans PILOTE : ${valeur}.`,
          categorie: "IMPORT",
        };
      case "VALEUR_HISTORISEE":
        return {
          description:
            "Import direct par la direction de projet : une valeur d'avancement plus récente a été importée.",
          categorie: "IMPORT",
        };
      case "PROPOSITION_VALEUR_CREEE":
        return {
          description: `Le territoire propose une nouvelle valeur d'avancement, en attente de traitement par la direction de projet. Valeur proposée : ${valeur ?? "N/A"}.`,
          categorie: "PROPOSITION",
        };
      case "PROPOSITION_VALEUR_MODIFIEE":
        return {
          description: `Le territoire modifie sa proposition de valeur d'avancement, toujours en attente de traitement par la direction de projet. Nouvelle valeur proposée : ${valeur ?? "N/A"}.`,
          categorie: "PROPOSITION",
        };
      case "PROPOSITION_VALEUR_SUPPRIMEE":
        return {
          description:
            "Le territoire retire sa proposition de valeur d'avancement avant tout traitement par la direction de projet.",
          categorie: "PROPOSITION",
        };
      case "PROPOSITION_VALEUR_ACCUSEE_RECEPTION":
        return {
          description:
            "La direction de projet accuse réception de la proposition du territoire : elle est prise en compte, mais pas encore acceptée ni refusée.",
          categorie: "PROPOSITION",
        };
      case "PROPOSITION_VALEUR_REFUSEE":
        return {
          description:
            "La direction de projet refuse la proposition du territoire : la valeur affichée dans PILOTE ne change pas.",
          categorie: "PROPOSITION",
        };
      case "PROPOSITION_VALEUR_ACCEPTEE":
        return {
          description: `La direction de projet accepte la proposition du territoire telle quelle. Nouvelle valeur affichée dans PILOTE : ${valeur}.`,
          categorie: "PROPOSITION",
        };
      case "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION":
        return {
          description: `La direction de projet accepte la proposition du territoire en corrigeant sa valeur. Nouvelle valeur affichée dans PILOTE : ${valeur}.`,
          categorie: "PROPOSITION",
        };
      case "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE":
        return {
          description:
            valeur === null
              ? "Un import direct par la direction de projet a pris le pas sur la proposition du territoire en cours pour cette date : elle est automatiquement écartée, sans validation. La valeur a été supprimée de PILOTE."
              : `Un import direct par la direction de projet a pris le pas sur la proposition du territoire en cours pour cette date : elle est automatiquement écartée, sans validation. Nouvelle valeur affichée dans PILOTE : ${valeur}.`,
          categorie: "IMPORT",
        };
      case "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE":
        return {
          description:
            "Une valeur d'avancement plus récente a été importée pour une date ultérieure, ce qui rend obsolète la proposition du territoire en cours sur cette date : elle est automatiquement écartée, sans validation, sans changer la valeur déjà affichée dans PILOTE.",
          categorie: "IMPORT",
        };
      default:
        return {
          description: typeEvenement,
          categorie: "IMPORT",
        };
    }
  }
}
