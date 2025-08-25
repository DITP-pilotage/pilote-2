import { NextApiRequest, NextApiResponse } from "next";
import { handleExportDesChantiersV2 } from "@/server/chantiers/infrastructure/handlers/ExportCSVChantierHandlerV2";

export default function handle(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  return handleExportDesChantiersV2(request, response);
}
