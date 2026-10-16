import { ReactNode } from "react";
import { DefaultValues, SubmitHandler } from "react-hook-form";
import { z } from "zod";

export interface Publication {
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurCreationNom: string;
  auteurCreationService: string | null;
  auteurCreationFonction: string | null;
  auteurModificationNom: string;
  auteurModificationService: string | null;
  auteurModificationFonction: string | null;
}

export interface PublicationBrouillon {
  id: string;
  contenu: string;
  dateModification: string;
}

export interface PublicationValues {
  contenu: string;
}

// T : valeurs saisies, suffisantes pour un brouillon.
// P : valeurs exigées pour publier, plus strictes que T (ex. météo obligatoire).
export interface PublicationActions<
  T extends PublicationValues = PublicationValues,
  P extends T = T,
> {
  publier: SubmitHandler<P>;
  enregistrerEnBrouillon: SubmitHandler<T>;
  publierBrouillon: SubmitHandler<P>;
  modifierBrouillon: SubmitHandler<T>;
  modifier: SubmitHandler<P>;
}

export type ConditionLabels<T extends PublicationValues> = Partial<
  Record<Extract<keyof T, string>, string>
>;

export interface PublicationFormConfig<
  T extends PublicationValues,
  P extends T = T,
> {
  draftSchema: z.ZodType<T, T>;
  publishSchema: z.ZodType<P, T>;
  maxLength: number;
  editValues: DefaultValues<T>;
  newValues: DefaultValues<T>;
  contentLabel?: string;
  conditionLabels: ConditionLabels<T>;
  extraFields?: ReactNode;
}
