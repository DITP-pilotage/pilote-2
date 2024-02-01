import { randomUUID } from 'node:crypto';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import DécisionStratégique from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import DécisionStratégiqueRepository
  from '@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class CréerUneDécisionStratégiqueUseCase {
  constructor(
    private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository,
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
