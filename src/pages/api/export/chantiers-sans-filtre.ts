import { NextApiRequest, NextApiResponse } from 'next';

import handleExportDesChantiersSansFiltre from '@/server/infrastructure/api/export/chantiers-sans-filtre';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleExportDesChantiersSansFiltre(request, response);
}
