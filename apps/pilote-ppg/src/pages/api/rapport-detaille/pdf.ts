import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import { handleRapportDetaillePdf } from "@/server/rapport-detaille/handlers/rapportDetaillePdfHandler";

export const config = { api: { responseLimit: false } };

export default async function handle(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const session = await auth(request, response);
  return handleRapportDetaillePdf(request, response, session);
}
