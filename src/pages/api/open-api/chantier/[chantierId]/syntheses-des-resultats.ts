import { NextApiRequest, NextApiResponse } from "next";
import logger from "@/server/infrastructure/Logger";
import { getContainer } from "@/server/dependances";
import { endpointProtege } from "@/server/app/error-boundary/endpoint-protege";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handle = async (request: NextApiRequest, response: NextApiResponse) => {
  const bearerToken = request.headers["authorization"];
  const token = (bearerToken || "").split(" ")[1];

  const utilisateurAuthentifie = await getContainer("legacy")
    .resolve("utilisateurAuthentifieJWTService")
    .recupererUtilisateurAuthentifie(token);

  const chantierId = request.query.chantierId as string;

  switch (request.method) {
    case "POST": {
      logger.info(
        "(API) Import des synthèses des résultats",
        `Chantier : ${chantierId}`,
      );

      await getContainer("importSyntheseDesResultats")
        .resolve("importSyntheseDesResultatsAPIHandler")
        .handle({
          request,
          response,
          chantierId,
          utilisateurAuthentifie,
        });

      logger.info(
        `(API) Import des synthèses des résultats pour le chantier ${chantierId} réussie`,
      );
      break;
    }
    default: {
      throw new BadRequestError("Bad request");
    }
  }
};

export default endpointProtege(handle);
