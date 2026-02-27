import { NextApiRequest, NextApiResponse } from "next";
import { ZodError } from "zod";
import { importObjectifsSchema } from "@/validation/import-objectif";
import { ImporterObjectifsUseCase } from "@/server/objectifs/usecases/ImporterObjectifsUseCase";
import {
  ImportObjectifAPIResponse,
  ImportObjectifErreur,
  ImportObjectifErrorResponse,
} from "@/server/objectifs/app/contrats/ImportObjectifAPIContrat";
import { UtilisateurAuthentifie } from "@/server/authentification/domain/UtilisateurAuthentifie";

export class ImportObjectifAPIHandler {
  constructor(
    private readonly dependencies: {
      importerObjectifsUseCase: ImporterObjectifsUseCase;
    },
  ) {}

  async handle({
    request,
    response,
    chantierId,
    utilisateurAuthentifie,
  }: {
    request: NextApiRequest;
    response: NextApiResponse<ImportObjectifAPIResponse>;
    chantierId: string;
    utilisateurAuthentifie: UtilisateurAuthentifie;
  }): Promise<void> {
    if (!utilisateurAuthentifie.peutSaisirCommentaireSurChantier(chantierId)) {
      response.status(403).json({
        message: `Vous n'êtes pas autorisé à saisir des objectifs pour le chantier ${chantierId}`,
        erreurs: [],
      });
      return;
    }

    let body;

    try {
      body = await this.parseBody(request);
    } catch {
      response.status(400).json({
        message: "Le corps de la requête n'est pas un JSON valide",
        erreurs: [],
      });
      return;
    }

    const validationResult = importObjectifsSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse = this.formatZodError(validationResult.error);
      response.status(400).json(errorResponse);
      return;
    }

    await this.dependencies.importerObjectifsUseCase.execute({
      chantierId,
      objectifs: validationResult.data.objectifs,
      auteurId: utilisateurAuthentifie.id,
    });

    response.status(200).json({
      message: "Les objectifs ont correctement été importés",
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

  private formatZodError(error: ZodError): ImportObjectifErrorResponse {
    const erreurs: ImportObjectifErreur[] = error.errors.map((zodError) => {
      const path = zodError.path;
      const index = typeof path[1] === "number" ? path[1] : 0;

      return {
        index,
        type: "",
        message: zodError.message,
      };
    });

    return {
      message: "Une erreur est survenue lors de l'import des objectifs",
      erreurs,
    };
  }
}
