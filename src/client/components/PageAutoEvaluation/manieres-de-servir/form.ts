import { z } from "zod";
import { useFormContext } from "react-hook-form";
import { evaluationSchema } from "@/server/evaluation/schemas";

export const formSchema = z.object({
  criteres: evaluationSchema.array(),
});

export type FormValuesCriteres = z.infer<typeof formSchema>;

export const useFormEvaluationCriteres = () =>
  useFormContext<FormValuesCriteres>();
