import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';

function parsePérimètreIds(req: NextApiRequest): string[] {
  const result = req.query.perimetre_ids || [];
  if (!Array.isArray(result)) {
    return [result];
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const périmètreIds = parsePérimètreIds(req);
  const chantierRepository = dependencies.getChantierRepository();
  const donnéesCarto = await chantierRepository.getAvancementMoyenParDépartement(périmètreIds);
  res.status(200).json(donnéesCarto);
}
