import { z } from "zod";

export const ANALYTICS_DIMENSIONS = [
  "profil_pilote",
  "conversation_id",
  "llm_call_id",
  "proposition_id",
  "proposition_mode",
  "type_question",
  "nombre_choix",
  "position_choix",
  "periode_information",
  "formation",
  "environnement",
] as const;

export type AnalyticsDimension = (typeof ANALYTICS_DIMENSIONS)[number];

export type DimensionSlots = Partial<Record<AnalyticsDimension, number>>;

export const MAX_DIMENSION_SLOT = 999;

export const dimensionSlotSchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_DIMENSION_SLOT);
