import { File } from "formidable";
import { NextApiRequest } from "next";
import { parseForm } from "@/server/import-indicateur/infrastructure/handlers/ParseForm";
import ImportMasseMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/ImportMasseMetadataIndicateurUseCase";
import type { Inject } from "@/server/parametrage-indicateur/module";

export class ImportMasseMetadataIndicateurHandler {
  private importMasseMetadataIndicateurUseCase: ImportMasseMetadataIndicateurUseCase;

  constructor({
    importMasseMetadataIndicateurUseCase,
  }: Inject<"importMasseMetadataIndicateurUseCase">) {
    this.importMasseMetadataIndicateurUseCase =
      importMasseMetadataIndicateurUseCase;
  }

  async handle(request: NextApiRequest) {
    const formData = await parseForm(request);

    const fichier = <File>formData.file![0];

    return this.importMasseMetadataIndicateurUseCase.run({
      nomDuFichier: fichier.filepath,
    });
  }
}
