import { z } from "zod";
import { DeepPartialSkipArrayKey } from "react-hook-form";
import { ConditionLabels, PublicationValues } from "./Publication.interface";

export interface ActionCondition {
  field: string;
  label: string;
  met: boolean;
}

const fieldsInError = (result: z.ZodSafeParseResult<unknown>) =>
  new Set(
    result.success
      ? []
      : result.error.issues.map((issue) => String(issue.path[0])),
  );

// Les champs exigés par l'action sont ceux que le schéma rejette sur un formulaire vide.
export const actionConditions = <T extends PublicationValues>(
  schema: z.ZodType<unknown, T>,
  values: DeepPartialSkipArrayKey<T>,
  labels: ConditionLabels<T>,
): ActionCondition[] => {
  const requiredFields = fieldsInError(schema.safeParse({}));
  const invalidFields = fieldsInError(schema.safeParse(values));
  const labelsByField = new Map<string, string | undefined>(
    Object.entries(labels),
  );
  return [...requiredFields].map((field) => ({
    field,
    label: labelsByField.get(field) ?? field,
    met: !invalidFields.has(field),
  }));
};

export const allConditionsMet = (conditions: ActionCondition[]) =>
  conditions.every((condition) => condition.met);
