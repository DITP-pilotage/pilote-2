import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';

interface Dependencies {
  territoireRepository: TerritoireRepository
}

export class RecupererTousLesTerritoiresUseCase {
  private territoireRepository: TerritoireRepository;

  constructor({ territoireRepository }: Dependencies) {
    this.territoireRepository = territoireRepository;
  }

  async run(): Promise<Territoire[]> {
    return this.territoireRepository.récupérerTous();
  }
}
