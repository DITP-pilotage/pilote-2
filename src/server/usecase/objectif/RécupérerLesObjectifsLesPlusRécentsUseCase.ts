import { Objectifs } from '@/server/domain/objectif/Objectif.interface';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerLesObjectifsLesPlusRécentsParTypeUseCase {
  constructor(
    private readonly objectifRepository: ObjectifRepository = dependencies.getObjectifRepository(),
  ) {}

  async run(chantierId: string) :Promise<Objectifs> {
    return this.objectifRepository.récupérerLesPlusRécentsParType(chantierId);
  }
}
