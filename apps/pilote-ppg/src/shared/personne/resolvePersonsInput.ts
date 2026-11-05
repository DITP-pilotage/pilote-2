import { z } from "zod";

// Volontairement plus large que z.uuid() (strict RFC) : un id altéré par le
// modèle ferait échouer tout le lot ; ResolvePersonsQuery l'écarte seul.
const HEXADECIMAL_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const resolvePersonsInputSchema = z.object({
  ids: z.array(z.string().regex(HEXADECIMAL_ID)).min(1).max(100),
});
