import { NextApiRequest, NextApiResponse } from 'next';

import handleChantierIdIndicateurs from '@/server/infrastructure/api/chantier/[chantierId]/indicateurs';

export default function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleChantierIdIndicateurs(request, response);
}
