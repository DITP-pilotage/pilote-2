import { NextApiRequest, NextApiResponse } from 'next';

import handleExportDesChantiers from '@/server/infrastructure/api/export/chantiers';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleExportDesChantiers(request, response);
}
