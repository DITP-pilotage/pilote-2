import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase {
  constructor(
    private readonly objectifRepository: ObjectifRepository = dependencies.getObjectifRepository(),
  ) {}

  async run(chantiersIds: string[]) {
    return this.objectifRepository.récupérerLesPlusRécentsGroupésParChantier(chantiersIds);
  }
}
