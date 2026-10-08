import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "@/server/framework/logger";
import { getContainer } from "@/server/dependances";
import { endpointProtege } from "@/server/app/error-boundary/endpoint-protege";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { UtilisateurAuthentifie } from "@/server/authentification/domain/UtilisateurAuthentifie";

export const recupererUtilisateurAuthentifieOpenApi = (
  request: NextApiRequest,
): Promise<UtilisateurAuthentifie> => {
  const token = (request.headers["authorization"] || "").split(" ")[1];

  return getContainer("authentification")
    .resolve("utilisateurAuthentifieJWTService")
    .recupererUtilisateurAuthentifie(token);
};

type ImportOpenApiHandler = {
  handle(params: {
    request: NextApiRequest;
    response: NextApiResponse;
    chantierId: string;
    utilisateurAuthentifie: UtilisateurAuthentifie;
  }): Promise<void>;
};

export const endpointImportOpenApi = ({
  source,
  libelle,
  recupererHandler,
}: {
  source: string;
  libelle: string;
  recupererHandler: () => ImportOpenApiHandler;
}) =>
  endpointProtege(async (request, response) => {
    const utilisateurAuthentifie =
      await recupererUtilisateurAuthentifieOpenApi(request);
    const chantierId = request.query.chantierId as string;

    if (request.method !== "POST") {
      throw new BadRequestError("Bad request");
    }

    logger.info({ categorie: "import", source, chantierId }, libelle);

    await recupererHandler().handle({
      request,
      response,
      chantierId,
      utilisateurAuthentifie,
    });

    logger.info(
      { categorie: "import", source, chantierId },
      `${libelle} réussi`,
    );
  });
