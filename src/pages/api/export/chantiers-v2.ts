import { NextApiRequest, NextApiResponse } from 'next';
import { handleExportDesChantiers } from '@/server/chantiers/infrastructure/handlers/ExportCSVChantierHandler';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleExportDesChantiers(request, response);
}
