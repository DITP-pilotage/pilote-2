// L'ordre de ces deux imports est significatif : `env` doit s'executer avant
// `integrationTestSetup`, qui importe le client Prisma — lequel lit
// `DATABASE_URL` des son import.
import "./env";
import "@/server/infrastructure/test/integrationTestSetup";
import { Albert } from "@/server/albert/Albert";
import { traceModel } from "./traceModel";
import { rateLimitModel } from "./rateLimitModel";

/**
 * Débit maximal vers l'API Albert. Réglable dans `.env.evals.local` quand
 * l'API renvoie encore des « Too Many Requests », ou pour accélérer un run
 * quand elle est peu chargée.
 */
const REQUETES_PAR_MINUTE = Number(process.env.EVAL_REQUETES_PAR_MINUTE ?? 15);

const limiterLeDebit = rateLimitModel({
  requetesParMinute: REQUETES_PAR_MINUTE,
});

// Chaque appel LLM fait pendant une `task` remonte en trace dans l'UI : les
// etapes de l'agent, et celles des sous-agents de recherche, qui passent eux
// aussi par Albert. Le limiteur enveloppe la trace, pour que l'attente ne
// compte pas dans la durée affichée de l'appel.
Albert.registerModelWrapper((model) => limiterLeDebit(traceModel(model)));
