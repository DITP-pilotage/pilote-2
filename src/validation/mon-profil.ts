import { z } from "zod";

export const validationModifierMonProfil = z
  .object({
    nom: z.string().min(1, "Ce champ est obligatoire").max(100),
    prenom: z.string().min(1, "Ce champ est obligatoire").max(100),
    email: z.string(),
    fonction: z.string().min(1, "Ce champ est obligatoire").max(100),
    service: z.string().min(1, "Ce champ est obligatoire"),
    serviceAutre: z
      .string()
      .max(200)
      .transform((value) => value || null)
      .nullable(),
    perimetreMinisteriel: z.string().min(1, "Ce champ est obligatoire"),
  })
  .superRefine((data, ctx) => {
    if (data.service === "autre" && !data.serviceAutre) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ce champ est obligatoire",
        path: ["serviceAutre"],
      });
    }
  });
