import { dependencies } from '@/server/infrastructure/Dependencies';
import ObjectifProjetStructurant from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ObjectifProjetStructurantRepository from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';

export default class RécupérerHistoriqueObjectifProjetStructurantUseCase {
  constructor(
    private readonly objectifRepository: ObjectifProjetStructurantRepository = dependencies.getObjectifProjetStructurantrepository(),
  ) {}

  async run(projetStructurantId: string): Promise<ObjectifProjetStructurant[]> {
    return this.objectifRepository.récupérerHistorique(projetStructurantId);
  }
}
