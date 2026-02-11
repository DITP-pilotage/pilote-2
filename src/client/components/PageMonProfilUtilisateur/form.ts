import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { validationModifierMonProfil } from "@/validation/mon-profil";

export const monProfilFormSchema = validationModifierMonProfil;

export type MonProfilFormValues = z.infer<typeof monProfilFormSchema>;

export const useMonProfilForm = () => useFormContext<MonProfilFormValues>();
