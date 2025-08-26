import { NextApiRequest, NextApiResponse } from "next";
import { handleExportDesHistoriquesIndicateursV2 } from "@/server/chantiers/infrastructure/handlers/ExportCSVHistoriqueIndicateurHandlerV2";

export default function handle(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  return handleExportDesHistoriquesIndicateursV2(request, response);
}
