import { NextApiRequest, NextApiResponse } from 'next';

import { TokenAPIJWTService } from '@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService';

export default async function handle(request: NextApiRequest, response: NextApiResponse) {
  const token = request.headers['authorization'];
  const decodedToken = await new TokenAPIJWTService({ secret: process.env.TOKEN_API_SECRET! }).decoderTokenAPI((token || '').split(' ')[1]);
  response.status(200).json({ resultat: `Bonjour ${decodedToken?.email}, vous pouvez utiliser l'API.` });
}
