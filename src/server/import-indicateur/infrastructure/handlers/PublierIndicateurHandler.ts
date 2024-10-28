import { NextApiRequest, NextApiResponse } from 'next';
import {
  PublierFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/PublierFichierIndicateurImporteUseCase';

type Dependencies = {
  publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase,
};

export class PublierFichierImportIndicateurHandler {
  private publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase;

  constructor({
    publierFichierIndicateurImporteUseCase,
  }: Dependencies) {
    this.publierFichierIndicateurImporteUseCase = publierFichierIndicateurImporteUseCase;
  }

  async handle(request: NextApiRequest,
    response: NextApiResponse) {
    await this.publierFichierIndicateurImporteUseCase.execute(
      {
        rapportId: request.query.rapportId as string,
      },
    );

    response.status(200).json({});
  }
}
