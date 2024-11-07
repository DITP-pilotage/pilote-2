import { File } from 'formidable';
import { NextApiRequest } from 'next';
import { parseForm } from '@/server/import-indicateur/infrastructure/handlers/ParseForm';
import ImportMasseMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/ImportMasseMetadataIndicateurUseCase';

type Dependencies = {
  importMasseMetadataIndicateurUseCase: ImportMasseMetadataIndicateurUseCase
};

export class ImportMasseMetadataIndicateurHandler {
  private importMasseMetadataIndicateurUseCase: ImportMasseMetadataIndicateurUseCase;

  constructor({
    importMasseMetadataIndicateurUseCase,
  }: Dependencies) {
    this.importMasseMetadataIndicateurUseCase = importMasseMetadataIndicateurUseCase;
  }

  async handle(request: NextApiRequest) {

    const formData = await parseForm(request);

    const fichier = <File>formData.file![0];

    return this.importMasseMetadataIndicateurUseCase.run({
      nomDuFichier: fichier.filepath,
    });
  }
}
