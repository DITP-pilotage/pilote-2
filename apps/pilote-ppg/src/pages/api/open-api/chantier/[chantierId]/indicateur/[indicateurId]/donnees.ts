import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "@/server/framework/logger";
import { handleListerIndicateurs } from "@/server/chantiers/infrastructure/handlers/ListerIndicateursHandler";
import { getContainer } from "@/server/dependances";
import { endpointProtege } from "@/server/app/error-boundary/endpoint-protege";
import { recupererUtilisateurAuthentifieOpenApi } from "@/server/app/open-api/endpointOpenApi";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handle = async (request: NextApiRequest, response: NextApiResponse) => {
  const utilisateurAuthentifie =
    await recupererUtilisateurAuthentifieOpenApi(request);

  switch (request.method) {
    case "GET": {
      logger.info(
        {
          categorie: "import",
          source: "open-api/donnees-indicateur",
          chantierId: request.query.chantierId as string,
          indicateurId: request.query.indicateurId as string,
        },
        "Export des données indicateur",
      );
      if (
        !utilisateurAuthentifie.peutAccederAuChantier(
          request.query.chantierId as string,
        )
      ) {
        throw new ForbiddenError(
          `Vous n'êtes pas autorisé à accéder à l'indicateur ${request.query.indicateurId}`,
        );
      }
      await handleListerIndicateurs({ request, response });
      logger.info(
        {
          categorie: "import",
          source: "open-api/donnees-indicateur",
          chantierId: request.query.chantierId as string,
          indicateurId: request.query.indicateurId as string,
        },
        "Export des données indicateur réussi",
      );
      break;
    }
    case "POST": {
      logger.info(
        {
          categorie: "import",
          source: "open-api/donnees-indicateur",
          chantierId: request.query.chantierId as string,
          indicateurId: request.query.indicateurId as string,
        },
        "Import des données indicateur",
      );
      if (
        !utilisateurAuthentifie.peutAccederEnEcritureAuChantier(
          request.query.chantierId as string,
        )
      ) {
        throw new ForbiddenError(
          `Vous n'êtes pas autorisé à accéder à l'indicateur ${request.query.indicateurId}`,
        );
      }
      await getContainer("importIndicateur")
        .resolve("importDonneeIndicateurAPIHandler")
        .handle({
          request,
          response,
          utilisateurId: utilisateurAuthentifie.id,
          email: utilisateurAuthentifie.email,
          profil: utilisateurAuthentifie.profil,
        });
      logger.info(
        {
          categorie: "import",
          source: "open-api/donnees-indicateur",
          chantierId: request.query.chantierId as string,
          indicateurId: request.query.indicateurId as string,
        },
        "Import des données indicateur réussi",
      );
      break;
    }
    default: {
      throw new BadRequestError("Bad request");
    }
  }
};

export default endpointProtege(handle);
