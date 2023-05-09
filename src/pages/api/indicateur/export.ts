import { NextApiRequest, NextApiResponse } from 'next';

import handleExportCsvDesIndicateurs from '@/server/infrastructure/api/indicateur/exportCsvDesIndicateurs';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleExportCsvDesIndicateurs(request, response);
}
