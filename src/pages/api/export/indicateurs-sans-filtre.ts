import { NextApiRequest, NextApiResponse } from 'next';

import handleExportDesIndicateursSansFiltre from '@/server/infrastructure/api/export/indicateurs-sans-filtre';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  if (process.env.NEXT_PUBLIC_FF_EXPORT_CSV !== 'true') {
    response.status(404);
    response.end('Non disponible');
    return;
  }

  return handleExportDesIndicateursSansFiltre(request, response);
}
