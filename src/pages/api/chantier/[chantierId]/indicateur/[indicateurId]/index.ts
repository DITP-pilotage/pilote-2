import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user.id;
  assert(userId);
  return getContainer("importIndicateur")
    .resolve("publierFichierImportIndicateurHandler")
    .handle(req, res, userId);
}
