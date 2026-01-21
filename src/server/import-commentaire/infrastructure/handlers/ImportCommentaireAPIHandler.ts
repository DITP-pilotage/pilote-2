import { NextApiRequest, NextApiResponse } from "next";
import { ZodError } from "zod";
import { importCommentairesSchema } from "@/validation/importCommentaire";
import { ImporterCommentairesUseCase } from "@/server/import-commentaire/usecases/ImporterCommentairesUseCase";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import {
  ImportCommentaireAPIResponse,
  ImportCommentaireErrorResponse,
} from "@/server/import-commentaire/app/contrats/ImportCommentaireAPIContrat";

export class ImportCommentaireAPIHandler {
  constructor(
    private readonly importerCommentairesUseCase: ImporterCommentairesUseCase,
  ) {}

  async handle({
    request,
    response,
    chantierId,
    auteurId,
    habilitations,
  }: {
    request: NextApiRequest;
    response: NextApiResponse<ImportCommentaireAPIResponse>;
    chantierId: string;
    auteurId: string;
    habilitations: Habilitations;
  }): Promise<void> {
    const body = await this.parseBody(request);

    const validationResult = importCommentairesSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse = this.formatZodError(validationResult.error);
      response.status(400).json(errorResponse);
      return;
    }

    const result = await this.importerCommentairesUseCase.execute({
      chantierId,
      commentaires: validationResult.data.commentaires,
      auteurId,
      habilitations,
    });

    if (result.success) {
      response.status(200).json({
        success: true,
        message: "Les commentaires ont correctement été importés",
        commentaires: result.commentaires!,
      });
    } else {
      response.status(400).json({
        success: false,
        message: "Une erreur est survenue lors de l'import des commentaires",
        erreurs: result.erreurs!,
      });
    }
  }

  private async parseBody(request: NextApiRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      request.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      request.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error("Le corps de la requête n'est pas un JSON valide"));
        }
      });

      request.on("error", reject);
    });
  }

  private formatZodError(error: ZodError): ImportCommentaireErrorResponse {
    const erreurs = error.errors.map((zodError) => {
      const path = zodError.path;
      const index = typeof path[1] === "number" ? path[1] : 0;

      return {
        index,
        territoire: "",
        type: "",
        message: zodError.message,
      };
    });

    return {
      success: false,
      message: "Une erreur est survenue lors de l'import des commentaires",
      erreurs,
    };
  }
}
