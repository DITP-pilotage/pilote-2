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
        { categorie: "import", source: "open-api/objectifs", chantierId },
        "Import des objectifs",
      );

      await getContainer("objectif")
        .resolve("importObjectifAPIHandler")
        .handle({
          request,
          response,
          chantierId,
          utilisateurAuthentifie,
        });

      logger.info(
        { categorie: "import", source: "open-api/objectifs", chantierId },
        "Import des objectifs réussi",
      );
      break;
    }
    default: {
      throw new BadRequestError("Bad request");
    }
  }
};

export default endpointProtege(handle);
