import { z } from "zod";

const CHANTIER_ID_ABREGE = /^ch[-\s]?(\d{1,3})$/i;

/**
 * Le modèle recopie l'identifiant tel que l'utilisateur l'a tapé (« CH-42 »),
 * alors que la base attend « CH-042 » : la requête ne trouvait alors rien.
 * On normalise au parse plutôt que de compter sur le prompt. Ce qui ne
 * ressemble pas à un identifiant de chantier passe tel quel : l'outil répond
 * « non trouvé » comme pour tout identifiant inconnu.
 */
export function normaliserChantierId({
  chantierId,
}: {
  chantierId: string;
}): string {
  const correspondance = CHANTIER_ID_ABREGE.exec(chantierId);
  if (!correspondance) {
    return chantierId;
  }
  return `CH-${correspondance[1].padStart(3, "0")}`;
}

export const chantierIdSchema = z
  .string()
  .trim()
  .transform((chantierId) => normaliserChantierId({ chantierId }))
  .describe("Identifiant du chantier (ex: CH-001)");

export const chantierIdsSchema = z.array(chantierIdSchema);
