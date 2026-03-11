import { MetadataParametrageIndicateurRepository } from "@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository";
import { MetadataParametrageIndicateur } from "@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur";
import type { Inject } from "@/server/parametrage-indicateur/module";

export default class RécupérerListeMetadataIndicateurUseCase {
  private metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository;

  constructor({
    metadataParametrageIndicateurRepository,
  }: Inject<"metadataParametrageIndicateurRepository">) {
    this.metadataParametrageIndicateurRepository =
      metadataParametrageIndicateurRepository;
  }

  async run(
    chantierIds: string[],
    perimetreIds: string[],
    estTerritorialise: boolean,
    estBarometre: boolean,
  ): Promise<MetadataParametrageIndicateur[]> {
    return this.metadataParametrageIndicateurRepository.recupererListeMetadataParametrageIndicateurEnFonctionDesFiltres(
      chantierIds,
      perimetreIds,
      estTerritorialise,
      estBarometre,
    );
  }
}
