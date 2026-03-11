import { NextApiRequest, NextApiResponse } from "next";
import { ZodError } from "zod";
import {
  ImportCommentaireInput,
  importCommentairesSchema,
  typesCommentaireAPINationaux,
  typesCommentaireAPIRegionauxDepartementaux,
} from "@/validation/import-commentaire";
import { ImporterCommentairesUseCase } from "@/server/commentaires/usecases/ImporterCommentairesUseCase";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import {
  ImportCommentaireAPIResponse,
  ImportCommentaireErreur,
  ImportCommentaireErrorResponse,
} from "@/server/commentaires/app/contrats/ImportCommentaireAPIContrat";
import { UtilisateurAuthentifie } from "@/server/authentification/domain/UtilisateurAuthentifie";
import type { Inject } from "@/server/commentaires/module";

export class ImportCommentaireAPIHandler {
  private readonly importerCommentairesUseCase: ImporterCommentairesUseCase;

  constructor({
    importerCommentairesUseCase,
  }: Inject<"importerCommentairesUseCase">) {
    this.importerCommentairesUseCase = importerCommentairesUseCase;
  }

  async handle({
    request,
    response,
    chantierId,
    utilisateurAuthentifie,
  }: {
    request: NextApiRequest;
    response: NextApiResponse<ImportCommentaireAPIResponse>;
    chantierId: string;
    utilisateurAuthentifie: UtilisateurAuthentifie;
  }): Promise<void> {
    if (!utilisateurAuthentifie.peutSaisirCommentaireSurChantier(chantierId)) {
      response.status(403).json({
        message: `Vous n'êtes pas autorisé à saisir des commentaires pour le chantier ${chantierId}`,
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

    const validationResult = importCommentairesSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse = this.formatZodError(validationResult.error);
      response.status(400).json(errorResponse);
      return;
    }

    const erreurs = this.validerCommentaires(
      validationResult.data.commentaires,
      chantierId,
      utilisateurAuthentifie.habilitations,
    );

    if (erreurs.length > 0) {
      response.status(400).json({
        message: "Une erreur est survenue lors de l'import des commentaires",
        erreurs,
      });
      return;
    }

    await this.importerCommentairesUseCase.execute({
      chantierId,
      commentaires: validationResult.data.commentaires,
      auteurId: utilisateurAuthentifie.id,
    });

    response.status(200).json({
      message: "Les commentaires ont correctement été importés",
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
      message: "Une erreur est survenue lors de l'import des commentaires",
      erreurs,
    };
  }

  private validerCommentaires(
    commentaires: ImportCommentaireInput[],
    chantierId: string,
    habilitations: Habilitations,
  ): ImportCommentaireErreur[] {
    const erreurs: ImportCommentaireErreur[] = [];

    commentaires.forEach((commentaire, index) => {
      const erreurHabilitation = this.validerHabilitation(
        commentaire,
        chantierId,
        habilitations,
      );
      if (erreurHabilitation) {
        erreurs.push({ index, ...erreurHabilitation });
        return;
      }

      const erreurTypeMaille = this.validerTypeMaille(commentaire);
      if (erreurTypeMaille) {
        erreurs.push({ index, ...erreurTypeMaille });
      }
    });

    return erreurs;
  }

  private validerHabilitation(
    commentaire: ImportCommentaireInput,
    chantierId: string,
    habilitations: Habilitations,
  ): Omit<ImportCommentaireErreur, "index"> | null {
    if (!habilitations.saisieCommentaire.chantiers.includes(chantierId)) {
      return {
        territoire: commentaire.territoire,
        type: commentaire.type,
        message: `Vous n'êtes pas autorisé à saisir des commentaires pour le chantier ${chantierId}`,
      };
    }

    if (
      !habilitations.saisieCommentaire.territoires.includes(
        commentaire.territoire,
      )
    ) {
      return {
        territoire: commentaire.territoire,
        type: commentaire.type,
        message: `Vous n'êtes pas autorisé à saisir des commentaires pour le territoire ${commentaire.territoire}`,
      };
    }

    return null;
  }

  private validerTypeMaille(
    commentaire: ImportCommentaireInput,
  ): Omit<ImportCommentaireErreur, "index"> | null {
    const maille = commentaire.territoire.split("-")[0];
    const isMailleNationale = maille === "NAT";
    const isMailleRegionaleOuDepartementale =
      maille === "REG" || maille === "DEPT";

    if (
      isMailleNationale &&
      !typesCommentaireAPINationaux.includes(commentaire.type)
    ) {
      return {
        territoire: commentaire.territoire,
        type: commentaire.type,
        message: `Le type '${commentaire.type}' n'est pas autorisé pour la maille nationale. Types autorisés : ${typesCommentaireAPINationaux.join(", ")}`,
      };
    }

    if (
      isMailleRegionaleOuDepartementale &&
      !typesCommentaireAPIRegionauxDepartementaux.includes(commentaire.type)
    ) {
      return {
        territoire: commentaire.territoire,
        type: commentaire.type,
        message: `Le type '${commentaire.type}' n'est pas autorisé pour la maille ${maille === "REG" ? "régionale" : "départementale"}. Types autorisés : ${typesCommentaireAPIRegionauxDepartementaux.join(", ")}`,
      };
    }

    return null;
  }
}
