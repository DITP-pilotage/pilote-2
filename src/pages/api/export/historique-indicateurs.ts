import { NextApiRequest, NextApiResponse } from 'next';
import { handleExportDesHistoriquesIndicateurs } from '@/server/chantiers/infrastructure/handlers/ExportCSVHistoriqueIndicateurHandler';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleExportDesHistoriquesIndicateurs(request, response);
}
