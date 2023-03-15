import { NextApiRequest, NextApiResponse } from 'next';
import handleChantierId from '@/server/infrastructure/api/chantier/[chantierId]';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleChantierId(req, res);
}
