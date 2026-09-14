import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import { toISODate, toISODateTime } from "@/server/app/domain/Dates";

export const PERIMETRES_HISTORIQUE = [
  "valeur_affichee",
  "propositions",
  "tout",
] as const;

export type PerimetreHistorique = (typeof PERIMETRES_HISTORIQUE)[number];

const TYPES_EVENEMENT_PAR_PERIMETRE: Record<
  Exclude<PerimetreHistorique, "tout">,
  string[]
> = {
  valeur_affichee: [
    EvenementValeurEnum.VALEUR_CREEE,
    EvenementValeurEnum.VALEUR_MODIFIEE,
    EvenementValeurEnum.VALEUR_HISTORISEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
  ],
  propositions: [
    EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
    EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
    EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE,
  ],
};

export type EvenementHistoriquePresente = {
  dateValeur: string;
  dateCreation: string;
  libelle: string;
  motif?: string;
  sourceDonneeEtMethodeCalcul?: string;
};

function traduireEnLibelle(
  evenement: IndicateurTerritoireValeurEvenement,
): string {
  const valeur = evenement.valeur;

  switch (evenement.typeEvenement) {
    case EvenementValeurEnum.VALEUR_CREEE:
      return `Nouvelle valeur affichée dans PILOTE : ${valeur}`;
    case EvenementValeurEnum.VALEUR_MODIFIEE:
      return valeur === null
        ? "Import de données par la direction de projet : la valeur a été supprimée de PILOTE"
        : `Import de données par la direction de projet : nouvelle valeur affichée dans PILOTE : ${valeur}`;
    case EvenementValeurEnum.VALEUR_HISTORISEE:
      return "Import d'une valeur d'avancement plus récente par la direction de projet";
    case EvenementValeurEnum.PROPOSITION_VALEUR_CREEE:
      return `Nouvelle proposition du territoire : ${valeur ?? "N/A"}`;
    case EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE:
      return `Modification de la proposition du territoire : ${valeur ?? "N/A"}`;
    case EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE:
      return "Suppression de la proposition par le territoire";
    case EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION:
      return "Accusé de réception de la proposition par la direction de projet";
    case EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE:
      return "Proposition refusée par la direction de projet";
    case EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE:
      return `Proposition acceptée par la direction de projet : nouvelle valeur affichée dans PILOTE : ${valeur}`;
    case EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION:
      return `Proposition acceptée avec modification par la direction de projet : nouvelle valeur affichée dans PILOTE : ${valeur}`;
    case EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE:
      return valeur === null
        ? "Import de données par la direction de projet (la proposition en cours a été ignorée) : la valeur a été supprimée de PILOTE"
        : `Import de données par la direction de projet (la proposition en cours a été ignorée) : nouvelle valeur affichée dans PILOTE : ${valeur}`;
    case EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE:
      return "Import d'une valeur d'avancement plus récente par la direction de projet (la proposition en cours a été ignorée)";
    default:
      return evenement.typeEvenement;
  }
}

// Duplique intentionnellement le filtre de RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase
// (qui alimente la modale) plutôt que de le réutiliser, pour ne pas faire porter à du code de
// production un besoin encore au stade POC. Si le POC est validé, ce filtre devra être mutualisé.
function filtrerEvenementsRedondants(
  evenements: IndicateurTerritoireValeurEvenement[],
): IndicateurTerritoireValeurEvenement[] {
  const evenementsParDateValeur = new Map<
    string,
    IndicateurTerritoireValeurEvenement[]
  >();

  evenements.forEach((evenement) => {
    const cle = toISODate(evenement.dateValeur);
    if (!evenementsParDateValeur.has(cle)) {
      evenementsParDateValeur.set(cle, []);
    }
    evenementsParDateValeur.get(cle)!.push(evenement);
  });

  const resultat: IndicateurTerritoireValeurEvenement[] = [];

  evenementsParDateValeur.forEach((evenementsDuJour) => {
    const evenementsTriesParOrdreDesc = [...evenementsDuJour].sort(
      (a, b) => b.ordre - a.ordre,
    );

    evenementsTriesParOrdreDesc.forEach((evenement, index) => {
      const evenementSuivant =
        evenementsTriesParOrdreDesc[index + 1]?.typeEvenement;

      if (evenement.typeEvenement === EvenementValeurEnum.VALEUR_MODIFIEE) {
        const estUnEchoTechnique = [
          EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
          EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
          EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE,
        ].includes(evenementSuivant as EvenementValeurEnum);
        if (!estUnEchoTechnique) {
          resultat.push(evenement);
        }
        return;
      }

      if (evenement.typeEvenement === EvenementValeurEnum.VALEUR_HISTORISEE) {
        if (
          evenementSuivant !==
          EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE
        ) {
          resultat.push(evenement);
        }
        return;
      }

      resultat.push(evenement);
    });
  });

  return resultat;
}

export function prepareHistoriqueIndicateurTerritoire(
  evenements: IndicateurTerritoireValeurEvenement[],
  options: {
    perimetre: PerimetreHistorique;
    dateDebut?: Date;
    dateFin?: Date;
  },
): EvenementHistoriquePresente[] {
  const evenementsDansLaPlage = evenements.filter((evenement) => {
    if (options.dateDebut && evenement.dateValeur < options.dateDebut) {
      return false;
    }
    if (options.dateFin && evenement.dateValeur > options.dateFin) {
      return false;
    }
    return true;
  });

  const evenementsDedupliques = filtrerEvenementsRedondants(
    evenementsDansLaPlage,
  );

  const typesAutorises =
    options.perimetre === "tout"
      ? null
      : TYPES_EVENEMENT_PAR_PERIMETRE[options.perimetre];

  const evenementsFiltresParPerimetre = typesAutorises
    ? evenementsDedupliques.filter((evenement) =>
        typesAutorises.includes(evenement.typeEvenement),
      )
    : evenementsDedupliques;

  return evenementsFiltresParPerimetre
    .map((evenement) => {
      const donneesComplementaires = evenement.donneesComplementaires as {
        motif?: string;
        sourceDonneeEtMethodeCalcul?: string;
      };

      return {
        dateValeur: toISODate(evenement.dateValeur),
        dateCreation: toISODateTime(evenement.dateCreation),
        libelle: traduireEnLibelle(evenement),
        ...(donneesComplementaires?.motif !== undefined
          ? { motif: donneesComplementaires.motif }
          : {}),
        ...(donneesComplementaires?.sourceDonneeEtMethodeCalcul !== undefined
          ? {
              sourceDonneeEtMethodeCalcul:
                donneesComplementaires.sourceDonneeEtMethodeCalcul,
            }
          : {}),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime(),
    );
}
