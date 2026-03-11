import { NextApiRequest, NextApiResponse } from "next";
import { PublierFichierIndicateurImporteUseCase } from "@/server/import-indicateur/usecases/PublierFichierIndicateurImporteUseCase";
import type { Inject } from "@/server/import-indicateur/module";

export class PublierFichierImportIndicateurHandler {
  private publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase;

  constructor({
    publierFichierIndicateurImporteUseCase,
  }: Inject<"publierFichierIndicateurImporteUseCase">) {
    this.publierFichierIndicateurImporteUseCase =
      publierFichierIndicateurImporteUseCase;
  }

  async handle(
    request: NextApiRequest,
    response: NextApiResponse,
    utilisateurId: string,
  ) {
    await this.publierFichierIndicateurImporteUseCase.execute({
      rapportId: request.query.rapportId as string,
      auteurId: utilisateurId,
    });

    response.status(200).json({});
  }
}
