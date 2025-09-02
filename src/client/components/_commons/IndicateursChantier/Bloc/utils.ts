import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";

export const estPropositionSupprimee = (detailIndicateur: DétailsIndicateur) =>
  detailIndicateur.propositionStatutTerritoire?.statut ===
  "PROPOSITION_VALEUR_SUPPRIMEE";

export const estPropositionAcceptee = (detailIndicateur: DétailsIndicateur) =>
  detailIndicateur.propositionStatutDirectionProjet?.statut ===
  "PROPOSITION_VALEUR_ACCEPTEE";

export const estPropositionAccepteeAvecModification = (
  detailIndicateur: DétailsIndicateur,
) =>
  detailIndicateur.propositionStatutDirectionProjet?.statut ===
  "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION";

export const estPropositionRefusee = (detailIndicateur: DétailsIndicateur) =>
  detailIndicateur.propositionStatutDirectionProjet?.statut ===
  "PROPOSITION_VALEUR_REFUSEE";

export const estPropositionAccuseeReception = (
  detailIndicateur: DétailsIndicateur,
) =>
  detailIndicateur.propositionStatutDirectionProjet?.statut ===
  "PROPOSITION_VALEUR_ACCUSEE_RECEPTION";

export const estPropositionModifiee = (detailIndicateur: DétailsIndicateur) =>
  detailIndicateur.propositionStatutTerritoire?.statut ===
  "PROPOSITION_VALEUR_MODIFIEE";
