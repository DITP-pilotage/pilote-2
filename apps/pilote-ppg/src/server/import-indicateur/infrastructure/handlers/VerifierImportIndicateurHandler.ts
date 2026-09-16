import { NextApiRequest, NextApiResponse } from "next";
import { File } from "formidable";
import { getToken } from "next-auth/jwt";
import assert from "node:assert/strict";
import { DetailValidationFichier } from "@/server/import-indicateur/domain/DetailValidationFichier";
import { DetailValidationFichierContrat } from "@/server/app/contrats/DetailValidationFichierContrat.interface";
import { parseForm } from "@/server/import-indicateur/infrastructure/handlers/ParseForm";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { configuration } from "@/config";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { VerifierFichierIndicateurImporteUseCase } from "@/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase";
import type { Inject } from "@/server/import-indicateur/module";

const présenterEnContrat = (
  report: DetailValidationFichier,
): DetailValidationFichierContrat => {
  return {
    id: report.id,
    estValide: report.estValide,
    listeErreursValidation: report.listeErreursValidation.map((erreur) => ({
      cellule: erreur.cellule,
      nom: erreur.nom,
      message: erreur.message,
      numeroDeLigne: erreur.numeroDeLigne,
      positionDeLigne: erreur.positionDeLigne,
      nomDuChamp: erreur.nomDuChamp,
      positionDuChamp: erreur.positionDuChamp,
    })),
  };
};

export class VerifierFichierImportIndicateurHandler {
  private verifierFichierIndicateurImporteUseCase: VerifierFichierIndicateurImporteUseCase;

  constructor({
    verifierFichierIndicateurImporteUseCase,
  }: Inject<"verifierFichierIndicateurImporteUseCase">) {
    this.verifierFichierIndicateurImporteUseCase =
      verifierFichierIndicateurImporteUseCase;
  }

  async handle(request: NextApiRequest, response: NextApiResponse) {
    const estSecuredEnv = configuration().nextAuth.url.startsWith("https://");

    const formData = await parseForm(request);

    const fichier = <File>formData.file![0];

    const sessionToken = await getToken({
      req: {
        headers: new Headers(request.headers as Record<string, string>),
      },
      secureCookie: estSecuredEnv,
      secret: configuration().nextAuth.secret,
    });
    const session = await auth(request, response);

    assert(sessionToken?.user);

    const report = await this.verifierFichierIndicateurImporteUseCase.execute({
      cheminCompletDuFichier: fichier.filepath,
      nomDuFichier: fichier.originalFilename as string,
      indicateurId: request.query.indicateurId as string,
      utilisateurAuteurDeLimportEmail: (sessionToken.user as { email: string })
        .email,
      isAdmin: session?.profil === ProfilEnum.DITP_ADMIN,
    });

    response.status(200).json(présenterEnContrat(report));
  }
}
