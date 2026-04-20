import { NextApiRequest, NextApiResponse } from "next";
import { ZodError } from "zod";
import {
  ImportSyntheseDesResultatsInput,
  importSynthesesDesResultatsSchema,
} from "@/validation/import-synthese-des-resultats";
import { ImporterSynthesesDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ImporterSynthesesDesResultatsUseCase";
import {
  ImportSyntheseDesResultatsAPIResponse,
  ImportSyntheseDesResultatsErreur,
  ImportSyntheseDesResultatsErrorResponse,
} from "@/server/syntheses-des-resultats/app/contrats/ImportSyntheseDesResultatsAPIContrat";
import { UtilisateurAuthentifie } from "@/server/authentification/domain/UtilisateurAuthentifie";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import logger from "@/server/infrastructure/Logger";
import type { Inject } from "@/server/syntheses-des-resultats/module";

export class ImportSyntheseDesResultatsAPIHandler {
  private readonly importerSynthesesDesResultatsUseCase: ImporterSynthesesDesResultatsUseCase;

  constructor({
    importerSynthesesDesResultatsUseCase,
  }: Inject<"importerSynthesesDesResultatsUseCase">) {
    this.importerSynthesesDesResultatsUseCase =
      importerSynthesesDesResultatsUseCase;
  }

  async handle({
    request,
    response,
    chantierId,
    utilisateurAuthentifie,
  }: {
    request: NextApiRequest;
    response: NextApiResponse<ImportSyntheseDesResultatsAPIResponse>;
    chantierId: string;
    utilisateurAuthentifie: UtilisateurAuthentifie;
  }): Promise<void> {
    if (!utilisateurAuthentifie.peutSaisirCommentaireSurChantier(chantierId)) {
      logger.warn(
        {
          categorie: "import",
          source: "ImportSyntheseDesResultatsAPIHandler",
          chantierId,
          email: utilisateurAuthentifie.email,
        },
        "Accès refusé pour saisie de synthèses des résultats",
      );
      response.status(403).json({
        message: `Vous n'êtes pas autorisé à saisir des synthèses des résultats pour le chantier ${chantierId}`,
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
          categorie: "import",
          source: "ImportSyntheseDesResultatsAPIHandler",
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

    const validationResult = importSynthesesDesResultatsSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          categorie: "import",
          source: "ImportSyntheseDesResultatsAPIHandler",
          chantierId,
          nombreErreurs: validationResult.error.errors.length,
        },
        "Validation Zod échouée pour import synthèses des résultats",
      );
      const errorResponse = this.formatZodError(validationResult.error);
      response.status(400).json(errorResponse);
      return;
    }

    const erreurs = this.validerSyntheses(
      validationResult.data.syntheses_des_resultats,
      chantierId,
      utilisateurAuthentifie.habilitations,
    );

    if (erreurs.length > 0) {
      logger.warn(
        {
          categorie: "import",
          source: "ImportSyntheseDesResultatsAPIHandler",
          chantierId,
          nombreErreurs: erreurs.length,
        },
        "Erreurs de validation métier pour import synthèses des résultats",
      );
      response.status(400).json({
        message:
          "Une erreur est survenue lors de l'import des synthèses des résultats",
        erreurs,
      });
      return;
    }

    await this.importerSynthesesDesResultatsUseCase.execute({
      chantierId,
      syntheses: validationResult.data.syntheses_des_resultats,
      auteurId: utilisateurAuthentifie.id,
    });

    response.status(200).json({
      message: "Les synthèses des résultats ont correctement été importées",
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
  ): ImportSyntheseDesResultatsErrorResponse {
    const erreurs: ImportSyntheseDesResultatsErreur[] = error.errors.map(
      (zodError) => {
        const path = zodError.path;
        const index = typeof path[1] === "number" ? path[1] : 0;

        return {
          index,
          territoire: "",
          message: zodError.message,
        };
      },
    );

    return {
      message:
        "Une erreur est survenue lors de l'import des synthèses des résultats",
      erreurs,
    };
  }

  private validerSyntheses(
    syntheses: ImportSyntheseDesResultatsInput[],
    chantierId: string,
    habilitations: Habilitations,
  ): ImportSyntheseDesResultatsErreur[] {
    const erreurs: ImportSyntheseDesResultatsErreur[] = [];

    syntheses.forEach((synthese, index) => {
      if (
        !habilitations.saisieCommentaire.territoires.includes(
          synthese.territoire,
        )
      ) {
        erreurs.push({
          index,
          territoire: synthese.territoire,
          message: `Vous n'êtes pas autorisé à saisir des synthèses des résultats pour le territoire ${synthese.territoire}`,
        });
      }
    });

    return erreurs;
  }
}
