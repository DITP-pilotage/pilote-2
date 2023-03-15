import { NextApiRequest, NextApiResponse } from 'next';

import handleChantierIdIndicateurs from '@/server/infrastructure/api/chantier/[chantierId]/indicateurs';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleChantierIdIndicateurs(req, res);
}
