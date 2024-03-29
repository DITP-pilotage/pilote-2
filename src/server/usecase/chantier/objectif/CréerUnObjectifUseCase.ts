import { randomUUID } from 'node:crypto';
import ObjectifRepository from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import Objectif, { TypeObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class CréerUnObjectifUseCase {
  constructor(
    private readonly objectifRepository: ObjectifRepository,
  ) {}

  async run(chantierId: string, contenu: string, auteur: string, type: TypeObjectif, habilitations: Habilitations): Promise<Objectif> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(chantierId, 'NAT-FR');

    const date = new Date();
    const id = randomUUID();
    return this.objectifRepository.créer(chantierId, id, contenu, auteur, type, date);
  }
}
