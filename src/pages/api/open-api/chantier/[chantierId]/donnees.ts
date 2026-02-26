import { NextApiRequest, NextApiResponse } from "next";
import assert from "node:assert";
import logger from "@/server/infrastructure/Logger";
import { UtilisateurAuthentifieJWTService } from "@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService";
import { dependencies } from "@/server/infrastructure/Dependencies";
import { getContainer } from "@/server/dependances";
import { endpointProtege } from "@/server/app/error-boundary/endpoint-protege";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

const handle = async (request: NextApiRequest, response: NextApiResponse) => {
  const bearerToken = request.headers["authorization"];

  assert(request.query.chantierId, "Le chantier id est obligatoire");

  const token = (bearerToken || "").split(" ")[1];
  const utilisateurAuthentifie = await new UtilisateurAuthentifieJWTService({
    utilisateurRepository: dependencies.getUtilisateurRepository(),
    tokenAPIRepository: dependencies.getTokenAPIInformationRepository(),
    profilRepository: dependencies.getAuthentificationProfilRepository(),
  }).recupererUtilisateurAuthentifie(token);

  switch (request.method) {
    case "GET": {
      logger.info(
        "(API) Export des données chantier",
        `Chantier : ${request.query.chantierId}`,
      );
      if (
        !utilisateurAuthentifie.peutAccederAuChantier(
          request.query.chantierId as string,
        )
      ) {
        throw new ForbiddenError(
          `Vous n'êtes pas autorisé à accéder au chantier ${request.query.chantierId}`,
        );
      }
      const jalonParam = request.query.jalon
        ? Number(request.query.jalon)
        : undefined;
      if (jalonParam !== undefined && Number.isNaN(jalonParam)) {
        throw new BadRequestError("Le paramètre jalon doit être un entier");
      }
      const donneeChantier = await getContainer("chantiers")
        .resolve("recupererDonneesChantierQuery")
        .handle(
          request.query.chantierId as string,
          utilisateurAuthentifie.habilitations.lecture.territoires,
          jalonParam,
        );
      response.status(200).json(donneeChantier);
      break;
    }
    default: {
      throw new BadRequestError("Bad request");
    }
  }
};

export default endpointProtege(handle);
