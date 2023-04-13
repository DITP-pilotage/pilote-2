import Objectif, { TypeObjectif } from '@/server/domain/objectif/Objectif.interface';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerObjectifLePlusRécentUseCase {
  constructor(
    private readonly objectifRepository: ObjectifRepository = dependencies.getObjectifRepository(),
  ) {}

  async run(chantierId: string, type: TypeObjectif): Promise<Objectif> {
    return this.objectifRepository.récupérerLePlusRécent(chantierId, type);
  }
}
