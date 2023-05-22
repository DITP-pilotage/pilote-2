import ObjectifProjetStructurant from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ObjectifProjetStructurantRepository from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerObjectifProjetStructurantLePlusRécentUseCase {
  constructor(
    private readonly objectifRepository: ObjectifProjetStructurantRepository = dependencies.getObjectifProjetStructurantrepository(),
  ) {}

  async run(projetStructurantId: string): Promise<ObjectifProjetStructurant> {
    return this.objectifRepository.récupérerLePlusRécent(projetStructurantId);
  }
}
