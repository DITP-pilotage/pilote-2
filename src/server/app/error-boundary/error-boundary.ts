import { NextApiRequest, NextApiResponse } from 'next';
import { TokenAPIJWTService } from '@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService';
import { PiloteError } from '@/server/app/error-boundary/pilote-error';
import { UnauthorizedError } from '@/server/app/error-boundary/unauthorized-error';
import { BadRequestError } from '@/server/app/error-boundary/bad-request-error';
import Logger from '@/server/infrastructure/Logger';
import { configuration } from '@/config';

const verifierAuthentification = async (request: NextApiRequest) => {
  const token = request.headers['authorization'] as string;
  if (!token) {
    throw new UnauthorizedError('Il vous manque le header Authorization avec le token API');
  }

  if (!/^Bearer \S+$/.test(token)) {
    throw new BadRequestError("Le token n'existe pas dans le header Authorization");
  }

  await new TokenAPIJWTService({ secret: configuration.tokenAPI.secret }).decoderTokenAPI(token.split(' ')[1]);
};

export const errorBondary =
  (...handlers: Function[]) =>
    async (request: NextApiRequest, response: NextApiResponse) => {
      try {

        await verifierAuthentification(request);

        for (const handler of handlers) {
          await handler(request, response);
        }
      } catch (error) {
        if (error instanceof PiloteError) {
          return response.status(error.status).json(
            { success: false, message: error.message },
          );
        } else {
          Logger.error(`Une erreur interne est survenue : ${(error as Error).message}`);
          return response.status(500).json(
            { success: false, message: 'Une erreur est survenue, veuillez contacter le support pour plus d\'information' },
          );
        }
      }
    };
