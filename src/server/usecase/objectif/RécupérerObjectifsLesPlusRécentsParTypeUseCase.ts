import Objectif, { TypeObjectif, typesObjectif } from '@/server/domain/objectif/Objectif.interface';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export type ObjectifTypé = { type: TypeObjectif, publication: Objectif };
export default class RécupérerObjectifsLesPlusRécentsParTypeUseCase {
  constructor(
    private readonly objectifRepository: ObjectifRepository = dependencies.getObjectifRepository(),
  ) {}

  async run(chantierId: string) {
    const objectifs: ObjectifTypé[] = [];

    for (const type of typesObjectif) {
      const objectif = await this.objectifRepository.récupérerLePlusRécent(chantierId, type);
      objectifs.push({
        type,
        publication: objectif,
      });
    }
    return objectifs;
  }
}
