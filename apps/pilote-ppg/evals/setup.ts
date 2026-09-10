// L'ordre de ces deux imports est significatif : `env` doit s'executer avant
// `integrationTestSetup`, qui importe le client Prisma — lequel lit
// `DATABASE_URL` des son import.
import "./env";
import "@/server/infrastructure/test/integrationTestSetup";
