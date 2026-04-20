import { useFormContext } from "react-hook-form";
import { z } from "zod";
import {
  evaluationAnnexeSchema,
  evaluationSchema,
} from "@/server/evaluation/schemas";

export const formSchemaObjectifs = z.object({
  objectifs: evaluationSchema
    .and(z.object({ annexe: evaluationAnnexeSchema }))
    .array(),
});

export type FormValuesObjectifs = z.infer<typeof formSchemaObjectifs>;

export const useFormEvaluationObjectifs = () =>
  useFormContext<FormValuesObjectifs>();
