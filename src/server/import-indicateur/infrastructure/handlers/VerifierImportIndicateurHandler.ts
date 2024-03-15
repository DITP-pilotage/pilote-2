import { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'formidable';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth/next';
import assert from 'node:assert/strict';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import { parseForm } from '@/server/import-indicateur/infrastructure/handlers/ParseForm';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { configuration } from '@/config';

// test

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

export default async function handleVerifierFichierImportIndicateur(
  request: NextApiRequest,
  response: NextApiResponse,
  verifierFichierIndicateurImporteUseCase = dependencies.getVerifierFichierIndicateurImporteUseCase(),
) {
  const estSecuredEnv = configuration.env === 'production';

  const formData = await parseForm(request);

  const fichier = <File>formData.file![0];

  const baseSchemaUrl = 'https://raw.githubusercontent.com/DITP-pilotage/pilote-2/main/public/schema/';
  const sessionToken = await getToken({ req: request, secureCookie: estSecuredEnv, secret: configuration.nextAuth.secret });
  const session = await getServerSession(request, response, authOptions);

  assert(sessionToken?.user);

  const report = await verifierFichierIndicateurImporteUseCase.execute(
    {
      cheminCompletDuFichier: fichier.filepath,
      nomDuFichier: fichier.originalFilename as string,
      baseSchemaUrl,
      indicateurId: request.query.indicateurId as string,
      utilisateurAuteurDeLimportEmail: (sessionToken.user as { email: string }).email,
      isAdmin: session?.profil === 'DITP_ADMIN',
    },
  );

  response.status(200).json(présenterEnContrat(report));
}
