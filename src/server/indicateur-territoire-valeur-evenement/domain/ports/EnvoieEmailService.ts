type ParametresEmailBase = {
  id_chantier: string;
  nom_chantier: string;
  id_indicateur: string;
  nom_indicateur: string;
  date_pva: string;
  va_actuelle: number | null;
  va_proposee: number | null;
};

export type TypeEvenementAvecNotifications =
  | "PROPOSITION_VALEUR_REFUSEE"
  | "PROPOSITION_VALEUR_ACCUSEE_RECEPTION"
  | "PROPOSITION_VALEUR_ACCEPTEE"
  | "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION";

type ParametresEmailPropositionMap = {
  PROPOSITION_VALEUR_REFUSEE: ParametresEmailBase & {
    motif_refus: string;
  };
  PROPOSITION_VALEUR_ACCUSEE_RECEPTION: ParametresEmailBase;
  PROPOSITION_VALEUR_ACCEPTEE: ParametresEmailBase;
  PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION: ParametresEmailBase & {
    valeur_acceptee: number;
    motif_modification: string;
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
