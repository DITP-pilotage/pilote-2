import { ComponentType } from "react";
import { $Enums } from "@prisma/client";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";
import { QuestionIcon } from "@/components/_commons/Icones/QuestionIcon";
import { LightbulbIcon } from "@/components/_commons/Icones/LightbulbIcon";
import { Chat2Icon } from "@/components/_commons/Icones/Chat2Icon";

export type FeedbackCategorie = {
  valeur: $Enums.llm_call_categorie_probleme;
  titre: string;
  sousTitre: string;
  icone: ComponentType<{ className?: string; fill?: string }>;
  couleurIcone: string;
};

export const FEEDBACK_CATEGORIES: FeedbackCategorie[] = [
  {
    valeur: $Enums.llm_call_categorie_probleme.PROBLEME_TECHNIQUE,
    titre: "Problème technique",
    sousTitre: "Erreur ou bug",
    icone: ErrorWarningIcon,
    couleurIcone: "text-dsfr-error-425",
  },
  {
    valeur: $Enums.llm_call_categorie_probleme.INCOMPREHENSION,
    titre: "Incompréhension",
    sousTitre: "Réponse pas claire",
    icone: QuestionIcon,
    couleurIcone: "text-dsfr-blue-france-sun-113",
  },
  {
    valeur: $Enums.llm_call_categorie_probleme.SUGGESTION,
    titre: "Suggestion",
    sousTitre: "Idée d'amélioration",
    icone: LightbulbIcon,
    couleurIcone: "text-dsfr-success-425",
  },
  {
    valeur: $Enums.llm_call_categorie_probleme.AUTRE,
    titre: "Autre",
    sousTitre: "Autre problème",
    icone: Chat2Icon,
    couleurIcone: "text-dsfr-grey-200",
  },
];

export const LIBELLES_CATEGORIES: Record<
  $Enums.llm_call_categorie_probleme,
  string
> = {
  PROBLEME_TECHNIQUE: "Problème technique",
  INCOMPREHENSION: "Incompréhension",
  SUGGESTION: "Suggestion",
  AUTRE: "Autre",
};
