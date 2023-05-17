import { randomUUID } from 'node:crypto';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import DécisionStratégique from '@/server/domain/décisionStratégique/DécisionStratégique.interface';
import DécisionStratégiqueRepository from '@/server/domain/décisionStratégique/DécisionStratégiqueRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class CréerUneDécisionStratégiqueUseCase {
  constructor(
    private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository = dependencies.getDécisionStratégiqueRepository(),
  ) {}

  async run(chantierId: Chantier['id'], contenu: string, auteur: string, habilitations: Habilitations): Promise<DécisionStratégique> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(chantierId, 'NAT-FR');

    const date = new Date();
    const id = randomUUID();
    const type = 'suiviDesDécisionsStratégiques';
    return this.décisionStratégiqueRepository.créer(chantierId, id, contenu, type, auteur, date);
  }
}
