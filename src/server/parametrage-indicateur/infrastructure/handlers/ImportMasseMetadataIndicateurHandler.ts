import { NextApiRequest } from 'next';
import { File } from 'formidable';
import { parseForm } from '@/server/import-indicateur/infrastructure/handlers/ParseForm';
import { dependencies } from '@/server/infrastructure/Dependencies';


export default async function handleImportMasseMetadataIndicateur(
  request: NextApiRequest,
  importMasseMetadataIndicateurUseCase = dependencies.getImportMasseMetadataIndicateurUseCase(),
) {

  const formData = await parseForm(request);

  const fichier = <File>formData.file![0];

  return importMasseMetadataIndicateurUseCase.run({
    nomDuFichier: fichier.filepath,
  });
}

