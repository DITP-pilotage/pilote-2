import { NextApiRequest, NextApiResponse } from "next";
import { ZodError } from "zod";
import { importDecisionsStrategiquesSchema } from "@/validation/import-decision-strategique";
import { ImporterDecisionsStrategiquesUseCase } from "@/server/decisions-strategiques/usecases/ImporterDecisionsStrategiquesUseCase";
import {
  ImportDecisionStrategiqueAPIResponse,
  ImportDecisionStrategiqueErreur,
  ImportDecisionStrategiqueErrorResponse,
} from "@/server/decisions-strategiques/app/contrats/ImportDecisionStrategiqueAPIContrat";
import { UtilisateurAuthentifie } from "@/server/authentification/domain/UtilisateurAuthentifie";
import logger from "@/server/infrastructure/Logger";
import type { Inject } from "@/server/decisions-strategiques/module";

export class ImportDecisionStrategiqueAPIHandler {
  private readonly importerDecisionsStrategiquesUseCase: ImporterDecisionsStrategiquesUseCase;

  constructor({
    importerDecisionsStrategiquesUseCase,
  }: Inject<"importerDecisionsStrategiquesUseCase">) {
    this.importerDecisionsStrategiquesUseCase =
      importerDecisionsStrategiquesUseCase;
  }

  async handle({
    request,
    response,
    chantierId,
    utilisateurAuthentifie,
  }: {
    request: NextApiRequest;
    response: NextApiResponse<ImportDecisionStrategiqueAPIResponse>;
    chantierId: string;
    utilisateurAuthentifie: UtilisateurAuthentifie;
  }): Promise<void> {
    if (!utilisateurAuthentifie.peutSaisirCommentaireSurChantier(chantierId)) {
      logger.warn(
        {
          categorie: "api",
          source: "ImportDecisionStrategiqueAPIHandler",
          chantierId,
          email: utilisateurAuthentifie.email,
        },
        "Accès refusé pour saisie de décisions stratégiques",
      );
      response.status(403).json({
        message: `Vous n'êtes pas autorisé à saisir des décisions stratégiques pour le chantier ${chantierId}`,
        erreurs: [],
      });
      return;
    }

    let body;

    try {
      body = await this.parseBody(request);
    } catch {
      logger.warn(
        {
          categorie: "api",
          source: "ImportDecisionStrategiqueAPIHandler",
          chantierId,
        },
        "Corps de requête JSON invalide",
      );
      response.status(400).json({
        message: "Le corps de la requête n'est pas un JSON valide",
        erreurs: [],
      });
      return;
    }

    const validationResult = importDecisionsStrategiquesSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          categorie: "api",
          source: "ImportDecisionStrategiqueAPIHandler",
          chantierId,
          nombreErreurs: validationResult.error.errors.length,
        },
        "Validation Zod échouée pour import décisions stratégiques",
      );
      const errorResponse = this.formatZodError(validationResult.error);
      response.status(400).json(errorResponse);
      return;
    }

    await this.importerDecisionsStrategiquesUseCase.execute({
      chantierId,
      decisionsStrategiques: validationResult.data.decisions_strategiques,
      auteurId: utilisateurAuthentifie.id,
    });

    response.status(200).json({
      message: "Les décisions stratégiques ont correctement été importées",
    });
  }

  private async parseBody(request: NextApiRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      request.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      request.on("end", () => {
        const body = Buffer.concat(
          chunks as unknown as Uint8Array[],
        ).toString();
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("Le corps de la requête n'est pas un JSON valide"));
        }
      });

      request.on("error", reject);
    });
  }

  private formatZodError(
    error: ZodError,
  ): ImportDecisionStrategiqueErrorResponse {
    const erreurs: ImportDecisionStrategiqueErreur[] = error.errors.map(
      (zodError) => {
        const path = zodError.path;
        const index = typeof path[1] === "number" ? path[1] : 0;

        return {
          index,
          type: "",
          message: zodError.message,
        };
      },
    );

    return {
      message:
        "Une erreur est survenue lors de l'import des décisions stratégiques",
      erreurs,
    };
  }
}
