import { NextApiRequest, NextApiResponse } from "next";
import { handleExportDesIndicateursV2 } from "@/server/chantiers/infrastructure/handlers/ExportCSVIndicateurHandlerV2";

export default function handle(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  return handleExportDesIndicateursV2(request, response);
}
