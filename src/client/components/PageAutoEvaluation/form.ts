import { z } from "zod";
import { useFormContext } from "react-hook-form";
import { evaluationSchema } from "@/server/evaluation/schemas";

export const formSchema = z.object({
  criteres: evaluationSchema.array(),
  objectifs: evaluationSchema.array(),
});

export type FormValues = z.infer<typeof formSchema>;

export const useFormEvaluation = () => useFormContext<FormValues>();
