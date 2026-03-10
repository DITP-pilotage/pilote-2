import { NextApiRequest, NextApiResponse } from "next";
import logger from "@/server/infrastructure/Logger";
import { UtilisateurAuthentifieJWTService } from "@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService";
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

  const utilisateurAuthentifie = await new UtilisateurAuthentifieJWTService({
    utilisateurRepository: getContainer("legacy").resolve(
      "utilisateurRepository",
    ),
    tokenAPIRepository: getContainer("legacy").resolve(
      "tokenAPIInformationRepository",
    ),
    profilRepository: getContainer("legacy").resolve(
      "authentificationProfilRepository",
    ),
  }).recupererUtilisateurAuthentifie(token);

  const chantierId = request.query.chantierId as string;

  switch (request.method) {
    case "POST": {
      logger.info("(API) Import des objectifs", `Chantier : ${chantierId}`);

      await getContainer("importObjectif")
        .resolve("importObjectifAPIHandler")
        .handle({
          request,
          response,
          chantierId,
          utilisateurAuthentifie,
        });

      logger.info(
        `(API) Import des objectifs pour le chantier ${chantierId} réussie`,
      );
      break;
    }
    default: {
      throw new BadRequestError("Bad request");
    }
  }
};

export default endpointProtege(handle);
