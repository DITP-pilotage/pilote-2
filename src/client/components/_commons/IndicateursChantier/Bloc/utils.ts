import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";

export const estPropositionSupprimee = (detailIndicateur: DétailsIndicateur) =>
  detailIndicateur.propositionStatutTerritoire?.statut ===
  EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE;

export const estPropositionAcceptee = (detailIndicateur: DétailsIndicateur) =>
  detailIndicateur.propositionStatutDirectionProjet?.statut ===
  EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE;

export const estPropositionAccepteeAvecModification = (
  detailIndicateur: DétailsIndicateur,
) =>
  detailIndicateur.propositionStatutDirectionProjet?.statut ===
  EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION;

export const estPropositionAccepteeOuAccepteeAvecModification = (
  detailIndicateur: DétailsIndicateur,
) =>
  estPropositionAcceptee(detailIndicateur) ||
  estPropositionAccepteeAvecModification(detailIndicateur);

export const estPropositionRefusee = (detailIndicateur: DétailsIndicateur) =>
  detailIndicateur.propositionStatutDirectionProjet?.statut ===
  EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE;

export const estPropositionCreee = (detailIndicateur: DétailsIndicateur) =>
  detailIndicateur.propositionStatutTerritoire?.statut ===
  EvenementValeurEnum.PROPOSITION_VALEUR_CREEE;

export const estPropositionAccuseeReception = (
  detailIndicateur: DétailsIndicateur,
) =>
  detailIndicateur.propositionStatutDirectionProjet?.statut ===
  EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION;

export const estPropositionModifiee = (detailIndicateur: DétailsIndicateur) =>
  detailIndicateur.propositionStatutTerritoire?.statut ===
  EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE;
