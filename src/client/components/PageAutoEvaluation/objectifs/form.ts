import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { evaluationSchema } from "@/server/evaluation/schemas";

export const formSchemaObjectifs = z.object({
  objectifs: evaluationSchema.array(),
});

export type FormValuesObjectifs = z.infer<typeof formSchemaObjectifs>;

export const useFormEvaluationObjectifs = () =>
  useFormContext<FormValuesObjectifs>();
