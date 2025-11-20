type ParametresEmailBase = {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  indicateurNom: string;
  dateValeur: string;
  valeurAvancement: string;
  valeurProposee: string;
};

export type TypeEvenementAvecNotifications =
  | "PROPOSITION_VALEUR_REFUSEE"
  | "PROPOSITION_VALEUR_ACCUSEE_RECEPTION"
  | "PROPOSITION_VALEUR_ACCEPTEE"
  | "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION";

type ParametresEmailPropositionMap = {
  PROPOSITION_VALEUR_REFUSEE: ParametresEmailBase & {
    motifRefus: string;
  };
  PROPOSITION_VALEUR_ACCUSEE_RECEPTION: ParametresEmailBase;
  PROPOSITION_VALEUR_ACCEPTEE: ParametresEmailBase;
  PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION: ParametresEmailBase & {
    valeurAcceptee: string;
    motifModification: string;
  };
};

export type ParametresEmailProposition<
  T extends TypeEvenementAvecNotifications,
> = ParametresEmailPropositionMap[T];

export interface EnvoieEmailService {
  envoieNotificationProposition<
    T extends TypeEvenementAvecNotifications,
  >(args: {
    destinataires: { email: string }[];
    templateId: number;
    parametres: ParametresEmailProposition<T>;
  }): Promise<void>;
}
