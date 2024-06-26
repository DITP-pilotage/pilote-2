import { NextApiRequest, NextApiResponse } from 'next';

import handleExportDesIndicateurs from '@/server/infrastructure/api/export/indicateurs';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleExportDesIndicateurs(request, response);
}
