import type { PilotePrismaClient } from "@/server/framework/persistence/PrismaTransaction";

// Aucune contrainte en base n'interdit deux périodes qui se chevauchent : les écritures
// de périodes passent l'une après l'autre, sous ce verrou libéré en fin de transaction.
export async function verrouillerPeriodes(
  client: PilotePrismaClient,
): Promise<void> {
  await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('formation_periode_information'))`;
}
