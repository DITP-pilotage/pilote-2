import { NextApiRequest, NextApiResponse } from 'next';

import handleExportCsvDesChantiers from '@/server/infrastructure/api/chantier/export';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleExportCsvDesChantiers(request, response);
}
