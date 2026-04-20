import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import {
  AgregateurListeChantiersParTerritoire,
  ChantierPourAgregation,
} from "@/client/utils/chantier/agrégateurListeChantiers/agregateur";
import { AgregatParTerritoire } from "@/client/utils/chantier/agrégateurListeChantiers/agregateur.interface";

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
  ): Promise<{
    agregat: AgregatParTerritoire;
    chantiers: ChantierPourAgregation[];
  }> {
    const chantiers =
      await this.chantierRepository.recupererDonneesAvancementChantiers(
        chantierIds,
        jalon,
      );

    return {
      agregat: new AgregateurListeChantiersParTerritoire(chantiers).agreger(),
      chantiers,
    };
  }
}
