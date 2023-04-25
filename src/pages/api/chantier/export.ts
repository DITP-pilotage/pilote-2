import { NextApiRequest, NextApiResponse } from 'next';

import handleExportCsv from '@/server/infrastructure/api/chantier/export';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleExportCsv(request, response);
}
