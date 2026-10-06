import { NextApiRequest, NextApiResponse } from "next";
import assert from "node:assert";
import logger from "@/server/framework/logger";
import { getContainer } from "@/server/dependances";
import { endpointProtege } from "@/server/app/error-boundary/endpoint-protege";
import { recupererUtilisateurAuthentifieOpenApi } from "@/server/app/open-api/endpointOpenApi";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

const handle = async (request: NextApiRequest, response: NextApiResponse) => {
  assert(request.query.chantierId, "Le chantier id est obligatoire");

  const utilisateurAuthentifie =
    await recupererUtilisateurAuthentifieOpenApi(request);

  switch (request.method) {
    case "GET": {
      logger.info(
        {
          categorie: "chantier",
          source: "open-api/donnees-chantier",
          chantierId: request.query.chantierId as string,
        },
        "Export des données chantier",
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
      const donneeChantier = await getContainer("chantiers")
        .resolve("recupererDonneesChantierQuery")
        .handle(
          request.query.chantierId as string,
          utilisateurAuthentifie.habilitations.lecture.territoires,
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
