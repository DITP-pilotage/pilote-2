import { NextApiRequest, NextApiResponse } from "next";
import { handleExportDesIndicateurs } from "@/server/chantiers/infrastructure/handlers/ExportCSVIndicateurHandler";

export default function handle(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  return handleExportDesIndicateurs(request, response);
}
