import { ObjectifRepository } from '@/server/fiche-conducteur/domain/ports/ObjectifRepository';
import { ObjectifType } from '@/server/fiche-conducteur/domain/ObjectifType';

interface Dependencies {
  objectifRepository: ObjectifRepository
}

export class RécupérerObjectifsUseCase {
  private objectifRepository: ObjectifRepository;

  constructor({ objectifRepository }: Dependencies) {
    this.objectifRepository = objectifRepository;
  }

  async run({ chantierId }: { chantierId: string }): Promise<Map<ObjectifType, string>> {
    const listeObjectifs = await this.objectifRepository.listerObjectifParChantierId({ chantierId });
    return listeObjectifs.reduce((acc, val) => {
      acc.set(val.type, val.contenu);
      return acc;
    }, new Map<ObjectifType, string>());
  }
}
