import { MetadataParametrageIndicateurRepository } from "@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository";
import { MetadataParametrageIndicateur } from "@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur";
import type { Inject } from "@/server/parametrage-indicateur/module";

export default class RécupérerMetadataIndicateurIdentifiantGénéréUseCase {
  private metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository;

  constructor({
    metadataParametrageIndicateurRepository,
  }: Inject<"metadataParametrageIndicateurRepository">) {
    this.metadataParametrageIndicateurRepository =
      metadataParametrageIndicateurRepository;
  }

  async run(): Promise<string> {
    const listeMetadataParametrageIndicateur: MetadataParametrageIndicateur[] =
      await this.metadataParametrageIndicateurRepository.recupererListeMetadataParametrageIndicateurEnFonctionDesFiltres(
        [],
        [],
        false,
        false,
      );
    const sortedListeMetadataParametrageIndicateur =
      listeMetadataParametrageIndicateur.sort(
        (metadataParametrageIndicateur1, metadataParametrageIndicateur2) =>
          metadataParametrageIndicateur1.indicId.localeCompare(
            metadataParametrageIndicateur2.indicId,
          ),
      );
    const identifiants = new Set(
      sortedListeMetadataParametrageIndicateur.map((li) =>
        Number(li.indicId.split("-")[1]),
      ),
    );
    let currentId = 1;
    while (identifiants.has(currentId)) {
      currentId++;
    }
    return `IND-${currentId.toString().padStart(3, "0")}`;
  }
}
