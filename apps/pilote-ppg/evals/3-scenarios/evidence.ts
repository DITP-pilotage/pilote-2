import type { ComposeDashboardOutput } from "@/server/albert/tools/composeDashboard";
import type { ObservedToolCall } from "../types";
import type { EvalProfile } from "../world";
import type { GroundTruth } from "./groundTruth";

/**
 * Tout ce qu'un critère peut regarder, qu'il soit mécanique ou jugé. Les
 * suites le construisent depuis un tour d'agent ; la calibration l'écrit à la
 * main. Un critère ne voit jamais le tour lui-même : la calibration peut donc
 * lui soumettre des réponses fabriquées.
 */
export type Evidence = {
  question: string;
  profile: EvalProfile;
  currentTerritory: string;
  /** Texte de la réponse dans le chat. */
  answer: string;
  /** Ce que lit le juge : texte, rapport rendu, ou dashboard décrit + texte. */
  matter: string;
  dashboard: ComposeDashboardOutput | null;
  toolCalls: ObservedToolCall[];
  /** Résultats d'outils du tour : seule source légitime de chiffres. */
  toolResults: { toolName: string; output: unknown }[];
  /** Territoires hors périmètre dont un outil a rendu des champs masqués. */
  maskedTerritories: string[];
  truth: GroundTruth;
  /** Codes des territoires que le tableau doit contenir, pour les comparaisons. */
  tableTerritories: string[];
};
