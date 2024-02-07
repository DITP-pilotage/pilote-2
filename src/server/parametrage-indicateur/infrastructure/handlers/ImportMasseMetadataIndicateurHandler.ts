import { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'formidable';
import { parseForm } from '@/server/import-indicateur/infrastructure/handlers/ParseForm';
import { dependencies } from '@/server/infrastructure/Dependencies';


export default async function handleImportMasseMetadataIndicateur(
  request: NextApiRequest,
  response: NextApiResponse,
  importMasseMetadataIndicateurUseCase = dependencies.getImportMasseMetadataIndicateurUseCase(),
) {

  const formData = await parseForm(request);

  // @ts-expect-error
  const fichier = <File>formData.file[0];

  return importMasseMetadataIndicateurUseCase.run({
    nomDuFichier: fichier.filepath,
  });
}

