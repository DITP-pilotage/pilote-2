import type { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";

export const ANALYTICS_CATEGORIES = ["assistant_ia"] as const;

export type AnalyticsCategory = (typeof ANALYTICS_CATEGORIES)[number];

export const ANALYTICS_ACTIONS = [
  "view",
  "open",
  "minimize",
  "resume",
  "close",
  "select",
  "submit",
  "start",
  "stop",
  "retry",
  "success",
  "error",
] as const;

export type AnalyticsAction = (typeof ANALYTICS_ACTIONS)[number];

export const ANALYTICS_EVENT_NAMES = [
  "assistant.open",
  "assistant.minimize",
  "assistant.resume",
  "assistant.close",
  "conversation.history.open",
  "prompt_proposition.click",
  "prompt_proposition.send",
  "question.send",
  "answer.complete",
  "answer.error",
  "answer.stop",
  "answer.retry",
  "speech.start",
  "response.choices",
  "response.choice",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export const ANALYTICS_ENVIRONNEMENTS = ["dev", "ppd", "prod"] as const;

export type AnalyticsEnvironnement = (typeof ANALYTICS_ENVIRONNEMENTS)[number];

export type AnalyticsDimensions = {
  profil_pilote?: ProfilCode;
  conversation_id?: string;
  llm_call_id?: string;
  proposition_id?: string;
  proposition_mode?: "envoi_direct" | "preremplissage";
  type_question?: "premiere_libre" | "premiere_proposition" | "suivante";
  nombre_choix?: number;
  position_choix?: number;
  environnement?: AnalyticsEnvironnement;
};

export type AnalyticsDimension = keyof AnalyticsDimensions;

export const ANALYTICS_DIMENSIONS = [
  "profil_pilote",
  "conversation_id",
  "llm_call_id",
  "proposition_id",
  "proposition_mode",
  "type_question",
  "nombre_choix",
  "position_choix",
  "environnement",
] as const satisfies readonly AnalyticsDimension[];

export type DimensionSlots = Partial<Record<AnalyticsDimension, number>>;

export type AnalyticsEvent = {
  category: AnalyticsCategory;
  action: AnalyticsAction;
  name: AnalyticsEventName;
  dimensions?: AnalyticsDimensions;
};

export type AnalyticsPageView = {
  title: string;
  dimensions?: AnalyticsDimensions;
};

export type AnalyticsConfig = {
  matomoUrl: string;
  siteId: string;
  dimensionSlots: DimensionSlots;
  globalDimensions?: AnalyticsDimensions;
};
