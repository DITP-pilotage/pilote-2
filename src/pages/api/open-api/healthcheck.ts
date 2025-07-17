import { NextApiRequest, NextApiResponse } from "next";

import { TokenAPIJWTService } from "@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService";
import { errorBoundary } from "@/server/app/error-boundary/error-boundary";
import { configuration } from "@/config";

const handle = async (request: NextApiRequest, response: NextApiResponse) => {
  const token = request.headers["authorization"];
  const decodedToken = await new TokenAPIJWTService({
    secret: configuration.tokenAPI.secret,
  }).decoderTokenAPI((token || "").split(" ")[1]);
  response
    .status(200)
    .json({
      resultat: `Bonjour ${decodedToken?.email}, vous pouvez utiliser l'API.`,
    });
};

export default errorBoundary(handle);
