import { z } from "zod";

export interface MotifsActionsIndisponibles {
  publier: string[];
  brouillon: string[];
}

const messagesErreur = (schema: z.ZodType, values: unknown) => {
  const result = schema.safeParse(values);
  return result.success
    ? []
    : [...new Set(result.error.issues.map((issue) => issue.message))];
};

export const motifsActionsIndisponibles = (
  values: unknown,
  {
    draftSchema,
    publishSchema,
  }: { draftSchema: z.ZodType; publishSchema: z.ZodType },
): MotifsActionsIndisponibles => ({
  publier: messagesErreur(publishSchema, values),
  brouillon: messagesErreur(draftSchema, values),
});

const enMinuscule = (message: string) =>
  message.charAt(0).toLowerCase() + message.slice(1);

const libelle = (actions: string, messages: string[]) =>
  messages.length > 0
    ? [`${actions} : ${messages.map(enMinuscule).join(" ; ")}.`]
    : [];

export const libellesMotifsActionsIndisponibles = ({
  publier,
  brouillon,
}: MotifsActionsIndisponibles): string[] => {
  const communs = publier.filter((message) => brouillon.includes(message));
  return [
    ...libelle("Publication et brouillon indisponibles", communs),
    ...libelle(
      "Publication indisponible",
      publier.filter((message) => !communs.includes(message)),
    ),
    ...libelle(
      "Brouillon indisponible",
      brouillon.filter((message) => !communs.includes(message)),
    ),
  ];
};
