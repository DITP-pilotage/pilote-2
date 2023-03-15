import { NextApiRequest, NextApiResponse } from 'next';
import handleIndicateurRépartitionsGéographiques from '@/server/infrastructure/api/indicateur/[indicateurId]/repartitions_geographiques';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleIndicateurRépartitionsGéographiques(req, res);
}
