import { MetadataParametrageIndicateurRepository } from "@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository";
import { MetadataParametrageIndicateur } from "@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur";
import type { Inject } from "@/server/parametrage-indicateur/module";

export default class RécupérerUnIndicateurUseCase {
  private metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository;

  constructor({
    metadataParametrageIndicateurRepository,
  }: Inject<"metadataParametrageIndicateurRepository">) {
    this.metadataParametrageIndicateurRepository =
      metadataParametrageIndicateurRepository;
  }

  async run(indicId: string): Promise<MetadataParametrageIndicateur> {
    return this.metadataParametrageIndicateurRepository.recupererMetadataParametrageIndicateurParIndicId(
      indicId,
    );
  }
}
