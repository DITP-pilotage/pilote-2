import { ChantierRepository } from "@/server/chantiers/infrastructure/sql/ChantierRepository.interface";
import {
  AgregateurListeChantiersParTerritoire,
  ChantierPourAgregation,
} from "@/server/chantiers/domain/agregateurListeChantiers/agregateur";
import { AgregatParTerritoire } from "@/server/chantiers/domain/agregateurListeChantiers/agregateur.interface";

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
