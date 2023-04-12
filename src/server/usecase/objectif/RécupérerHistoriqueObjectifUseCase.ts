import { dependencies } from '@/server/infrastructure/Dependencies';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import Objectif, { TypeObjectif } from '@/server/domain/objectif/Objectif.interface';

export default class RécupérerHistoriqueObjectifUseCase {
  constructor(
    private readonly objectifRepository: ObjectifRepository = dependencies.getObjectifRepository(),
  ) {}

  async run(chantierId: string, type: TypeObjectif): Promise<Objectif[]> {
    return this.objectifRepository.récupérerHistoriqueDUnObjectif(chantierId, type);
  }
}
