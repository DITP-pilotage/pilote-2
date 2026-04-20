import { NextApiRequest, NextApiResponse } from "next";
import { handleExportDesUtilisateurs } from "@/server/gestion-utilisateur/infrastructure/handlers/ExportCSVUtilisateurHandler";

export default function handle(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  return handleExportDesUtilisateurs(request, response);
}
