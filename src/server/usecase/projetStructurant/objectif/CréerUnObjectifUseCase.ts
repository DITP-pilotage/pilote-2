import { randomUUID } from 'node:crypto';
import { dependencies } from '@/server/infrastructure/Dependencies';
import ObjectifProjetStructurantRepository from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';

export default class CréerUnObjectifProjetStructurantUseCase {
  constructor(
    private readonly objectifRepository: ObjectifProjetStructurantRepository = dependencies.getObjectifProjetStructurantrepository(),
  ) {}

  async run(projetStructurantId: string, contenu: string, auteur: string) {
    const date = new Date();
    const id = randomUUID();
    return this.objectifRepository.créer(projetStructurantId, id, contenu, auteur, date);
  }
}
