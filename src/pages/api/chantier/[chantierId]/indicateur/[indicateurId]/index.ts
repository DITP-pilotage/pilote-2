import { NextApiRequest, NextApiResponse } from "next";

import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await auth(req, res);
  const userId = session?.user.id;
  assert(userId);
  return getContainer("importIndicateur")
    .resolve("publierFichierImportIndicateurHandler")
    .handle(req, res, userId);
}
