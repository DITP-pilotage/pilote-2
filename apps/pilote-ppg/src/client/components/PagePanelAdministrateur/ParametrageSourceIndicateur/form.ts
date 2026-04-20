import { z } from "zod";
import { useFormContext } from "react-hook-form";

const valeurAccepteSchema = z.object({
  ordre: z.number(),
  valeur: z.string(),
  nom: z.string(),
  description: z.string(),
});

const metadataIndicateurSchema = z.object({
  name: z.string().min(1, "Le nom du champ est obligatoire"),
  dataType: z.enum(["text", "boolean", "number"]),
  description: z.string(),
  estVisible: z.boolean(),
  alias: z.string().min(1, "L'alias est obligatoire"),
  estEditable: z.boolean(),
  validationRegex: z.string(),
  validationRegexErrorMessage: z.string().nullable(),
  editBoxType: z
    .enum(["text", "textarea", "boolean", "multi-select"])
    .nullable(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  estObligatoire: z.boolean(),
  doitAfficherLaDescription: z.boolean(),
  listeValeursAcceptes: z.array(valeurAccepteSchema),
  groupe: z.enum([
    "METADATA_INDICATEURS",
    "METADATA_PARAMETRAGE_INDICATEURS",
    "METADATA_INDICATEURS_COMPLEMENTAIRE",
  ]),
  blocId: z.number().nullable(),
});

export const formSchema = z.object({
  metadataList: z.array(metadataIndicateurSchema),
});

export type FormValues = z.infer<typeof formSchema>;

export const useFormParametrageSource = () => useFormContext<FormValues>();
