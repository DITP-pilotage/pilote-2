import { NextApiRequest, NextApiResponse } from 'next';
import handleIndicateurId from '@/server/infrastructure/api/indicateur/[indicateurId]';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleIndicateurId(req, res);
}
