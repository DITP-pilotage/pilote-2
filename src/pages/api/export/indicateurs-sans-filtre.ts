import { NextApiRequest, NextApiResponse } from 'next';

import handleExportDesIndicateursSansFiltre from '@/server/infrastructure/api/export/indicateurs-sans-filtre';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleExportDesIndicateursSansFiltre(request, response);
}
