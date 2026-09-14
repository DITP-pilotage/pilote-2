import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";

export type LibelleEvenement = {
  description: string | null;
  resultat: string | null;
};

export function libelleEvenementIndicateurTerritoireValeur(
  typeEvenement: TypeEvenement,
  valeur: number | null,
): LibelleEvenement {
  switch (typeEvenement) {
    case "VALEUR_CREEE":
      return {
        description: null,
        resultat: `nouvelle valeur affichée dans PILOTE : ${valeur}`,
      };
    case "VALEUR_MODIFIEE":
      return {
        description: "import de données par la direction de projet",
        resultat:
          valeur === null
            ? "la valeur a été supprimée de PILOTE"
            : `nouvelle valeur affichée dans PILOTE : ${valeur}`,
      };
    case "VALEUR_HISTORISEE":
      return {
        description:
          "import d'une valeur d'avancement plus récente par la direction de projet",
        resultat: null,
      };
    case "PROPOSITION_VALEUR_CREEE":
      return {
        description: `nouvelle proposition du territoire : ${valeur ?? "N/A"}`,
        resultat: null,
      };
    case "PROPOSITION_VALEUR_MODIFIEE":
      return {
        description: `modification de la proposition du territoire : ${valeur ?? "N/A"}`,
        resultat: null,
      };
    case "PROPOSITION_VALEUR_SUPPRIMEE":
      return {
        description: "suppression de la proposition par le territoire",
        resultat: null,
      };
    case "PROPOSITION_VALEUR_ACCUSEE_RECEPTION":
      return {
        description:
          "accusé de réception de la proposition par la direction de projet",
        resultat: null,
      };
    case "PROPOSITION_VALEUR_REFUSEE":
      return {
        description: "proposition refusée par la direction de projet",
        resultat: null,
      };
    case "PROPOSITION_VALEUR_ACCEPTEE":
      return {
        description: "proposition acceptée par la direction de projet",
        resultat: `nouvelle valeur affichée dans PILOTE : ${valeur}`,
      };
    case "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION":
      return {
        description:
          "proposition acceptée avec modification par la direction de projet",
        resultat: `nouvelle valeur affichée dans PILOTE : ${valeur}`,
      };
    case "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE":
      return {
        description:
          "import de données par la direction de projet (la proposition en cours a été ignorée)",
        resultat:
          valeur === null
            ? "la valeur a été supprimée de PILOTE"
            : `nouvelle valeur affichée dans PILOTE : ${valeur}`,
      };
    case "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE":
      return {
        description:
          "import d'une valeur d'avancement plus récente par la direction de projet (la proposition en cours a été ignorée)",
        resultat: null,
      };
    default:
      return { description: typeEvenement, resultat: null };
  }
}
