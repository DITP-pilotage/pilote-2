import { NextApiRequest, NextApiResponse } from "next";
import logger from "@/server/infrastructure/Logger";
import { UtilisateurAuthentifieJWTService } from "@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService";
import { dependencies } from "@/server/infrastructure/Dependencies";
import { getContainer } from "@/server/dependances";
import { errorBoundary } from "@/server/app/error-boundary/error-boundary";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";
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
    utilisateurRepository: dependencies.getUtilisateurRepository(),
    tokenAPIRepository: dependencies.getTokenAPIInformationRepository(),
    profilRepository: dependencies.getAuthentificationProfilRepository(),
  }).recupererUtilisateurAuthentifie(token);

  const chantierId = request.query.chantierId as string;

  switch (request.method) {
    case "POST": {
      logger.info("(API) Import des commentaires", `Chantier : ${chantierId}`);

      if (
        !utilisateurAuthentifie.peutSaisirCommentaireSurChantier(chantierId)
      ) {
        throw new ForbiddenError(
          `Vous n'êtes pas autorisé à saisir des commentaires pour le chantier ${chantierId}`,
        );
      }

      await getContainer("importCommentaire")
        .resolve("importCommentaireAPIHandler")
        .handle({
          request,
          response,
          chantierId,
          auteurId: utilisateurAuthentifie.id,
          habilitations: utilisateurAuthentifie.habilitations,
        });

      logger.info(
        `(API) Import des commentaires pour le chantier ${chantierId} réussie`,
      );
      break;
    }
    default: {
      throw new BadRequestError("Bad request");
    }
  }
};

export default errorBoundary(handle);
