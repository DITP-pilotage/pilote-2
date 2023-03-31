import { NextApiRequest, NextApiResponse } from 'next';
import handleHistoriqueDeLaSynthèseDesRésultats
  from '@/server/infrastructure/api/chantier/[chantierId]/historiqueDeLaSynthèseDesRésultats';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleHistoriqueDeLaSynthèseDesRésultats(req, res);
}
