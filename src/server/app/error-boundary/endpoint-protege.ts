import { NextApiRequest, NextApiResponse } from "next";
import { TokenAPIJWTService } from "@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";
import { errorHandler } from "@/server/app/error-boundary/error-handler";
import { configuration } from "@/config";

const verifierAuthentification = async (request: NextApiRequest) => {
  const token = request.headers["authorization"] as string;
  if (!token) {
    throw new UnauthorizedError(
      "Il vous manque le header Authorization avec le token API",
    );
  }

  if (!/^Bearer \S+$/.test(token)) {
    throw new BadRequestError(
      "Le token n'existe pas dans le header Authorization",
    );
  }

  await new TokenAPIJWTService({
    secret: configuration().tokenAPI.secret,
  }).decoderTokenAPI(token.split(" ")[1]);
};

export const endpointProtege =
  (...handlers: Function[]) =>
  async (request: NextApiRequest, response: NextApiResponse) => {
    return errorHandler(async (req, res) => {
      await verifierAuthentification(req);

      for (const handler of handlers) {
        await handler(req, res);
      }
    })(request, response);
  };
