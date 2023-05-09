import { NextApiRequest, NextApiResponse } from 'next';

import handleExportDesChantiersSansFiltre from '@/server/infrastructure/api/export/chantiers-sans-filtre';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  if (process.env.NEXT_PUBLIC_FF_EXPORT_CSV !== 'true') {
    response.status(404);
    response.end('Non disponible');
    return;
  }

  return handleExportDesChantiersSansFiltre(request, response);
}
