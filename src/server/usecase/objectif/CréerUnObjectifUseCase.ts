import { randomUUID } from 'node:crypto';
import { dependencies } from '@/server/infrastructure/Dependencies';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import Objectif, { TypeObjectif } from '@/server/domain/objectif/Objectif.interface';

export default class CréerUnObjectifUseCase {
  constructor(
    private readonly objectifRepository: ObjectifRepository = dependencies.getObjectifRepository(),
  ) {}

  async run(chantierId: string, contenu: string, auteur: string, type: TypeObjectif): Promise<Objectif> {
    const date = new Date();
    const id = randomUUID();
    return this.objectifRepository.créer(chantierId, id, contenu, auteur, type, date);
  }
}
