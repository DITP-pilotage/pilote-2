import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import { AgrégateurListeChantiersParTerritoire } from "@/client/utils/chantier/agrégateurListeChantiers/agrégateur";
import { AgrégatParTerritoire } from "@/client/utils/chantier/agrégateurListeChantiers/agrégateur.interface";

export class AgregerAvancementsChantiersUseCase {
  private chantierRepository: ChantierRepository;

  constructor({
    chantierRepository,
  }: {
    chantierRepository: ChantierRepository;
  }) {
    this.chantierRepository = chantierRepository;
  }

  async run(
    chantierIds: string[],
    jalon: number,
  ): Promise<AgrégatParTerritoire> {
    const chantiers =
      await this.chantierRepository.recupererDonneesAvancementChantiers(
        chantierIds,
        jalon,
      );
    return new AgrégateurListeChantiersParTerritoire(chantiers).agréger();
  }
}
