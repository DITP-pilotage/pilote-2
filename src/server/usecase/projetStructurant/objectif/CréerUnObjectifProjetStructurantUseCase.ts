import { randomUUID } from 'node:crypto';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import ObjectifProjetStructurantRepository from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';
import ObjectifProjetStructurant, { TypeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';

export default class CréerUnObjectifProjetStructurantUseCase {
  constructor(
    private readonly objectifRepository: ObjectifProjetStructurantRepository = dependencies.getObjectifProjetStructurantRepository(),
  ) {}

  async run(projetStructurantId: string, territoireCode: string, contenu: string, auteur: string, type: TypeObjectifProjetStructurant, habilitations: Habilitations): Promise<ObjectifProjetStructurant> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublicationsProjetsStructurants(territoireCode);

    const date = new Date();
    const id = randomUUID();
    return this.objectifRepository.créer(projetStructurantId, id, contenu, auteur, type, date);
  }
}
