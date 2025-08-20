import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";

export function estPropositionSupprimee(detailIndicateur: DétailsIndicateur) {
  return (
    detailIndicateur.propositionStatutTerritoire?.statut ===
    "PROPOSITION_VALEUR_SUPPRIMEE"
  );
}

export function estPropositionRefusee(detailIndicateur: DétailsIndicateur) {
  return (
    detailIndicateur.propositionStatutDirectionProjet?.statut ===
    "PROPOSITION_VALEUR_REFUSEE"
  );
}

export function estPropositionAccuseeReception(
  detailIndicateur: DétailsIndicateur,
) {
  return (
    detailIndicateur.propositionStatutDirectionProjet?.statut ===
    "PROPOSITION_VALEUR_ACCUSEE_RECEPTION"
  );
}

export function estPropositionModifiee(detailIndicateur: DétailsIndicateur) {
  return (
    detailIndicateur.propositionStatutTerritoire?.statut ===
    "PROPOSITION_VALEUR_MODIFIEE"
  );
}
