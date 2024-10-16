import { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'formidable';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth/next';
import assert from 'node:assert/strict';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import { parseForm } from '@/server/import-indicateur/infrastructure/handlers/ParseForm';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { configuration } from '@/config';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
import {
  VerifierFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase';

const présenterEnContrat = (report: DetailValidationFichier): DetailValidationFichierContrat => {
  return {
    id: report.id,
    estValide: report.estValide,
    listeErreursValidation: report.listeErreursValidation.map(erreur => ({
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

type Dependencies = {
  verifierFichierIndicateurImporteUseCase: VerifierFichierIndicateurImporteUseCase
};

export class VerifierFichierImportIndicateurHandler {
  private verifierFichierIndicateurImporteUseCase: VerifierFichierIndicateurImporteUseCase;

  constructor({
    verifierFichierIndicateurImporteUseCase,
  }: Dependencies) {
    this.verifierFichierIndicateurImporteUseCase = verifierFichierIndicateurImporteUseCase;
  }

  async handle(request: NextApiRequest,
    response: NextApiResponse) {
    const estSecuredEnv = configuration.env === 'production';

    const formData = await parseForm(request);

    const fichier = <File>formData.file![0];

    const récupérerVariableContenuUseCase = new RécupérerVariableContenuUseCase();
    const baseSchemaUrl = récupérerVariableContenuUseCase.run({ nomVariableContenu: 'NEXT_PUBLIC_SCHEMA_VALIDATA_URL' });
    const sessionToken = await getToken({
      req: request,
      secureCookie: estSecuredEnv,
      secret: configuration.nextAuth.secret,
    });
    const session = await getServerSession(request, response, authOptions);

    assert(sessionToken?.user);

    const report = await this.verifierFichierIndicateurImporteUseCase.execute(
      {
        cheminCompletDuFichier: fichier.filepath,
        nomDuFichier: fichier.originalFilename as string,
        // @ts-expect-error baseSchemaUrl ne peut être undefined
        baseSchemaUrl,
        indicateurId: request.query.indicateurId as string,
        utilisateurAuteurDeLimportEmail: (sessionToken.user as { email: string }).email,
        isAdmin: session?.profil === ProfilEnum.DITP_ADMIN,
      },
    );

    response.status(200).json(présenterEnContrat(report));
  }
}
