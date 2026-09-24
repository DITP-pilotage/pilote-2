// L'ordre de ces deux imports est significatif : `env` doit s'executer avant
// `integrationTestSetup`, qui importe le client Prisma — lequel lit
// `DATABASE_URL` des son import.
import "./env";
import "@/server/infrastructure/test/integrationTestSetup";
import { Albert } from "@/server/albert/Albert";
import { traceModel } from "./traceModel";

// Chaque appel LLM fait pendant une `task` remonte en trace dans l'UI : les
// etapes de l'agent, et celles des sous-agents de recherche, qui passent eux
// aussi par Albert.
Albert.registerModelWrapper(traceModel);
