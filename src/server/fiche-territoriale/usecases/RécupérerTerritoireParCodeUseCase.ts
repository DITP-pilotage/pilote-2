import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { Territoire } from '@/server/fiche-territoriale/domain/Territoire';

export class RécupérerTerritoireParCodeUseCase {
  private territoireRepository: TerritoireRepository;

  constructor({ territoireRepository }: { territoireRepository: TerritoireRepository }) {
    this.territoireRepository = territoireRepository;
  }

  async run({ territoireCode }: { territoireCode: string } ): Promise<Territoire> {
    return this.territoireRepository.recupererTerritoireParCode({ territoireCode });
  }
}
