import { randomUUID } from 'node:crypto';
import { Chantier } from '@/server/chantiers/domain/Chantier.interface';
import { DécisionStratégique } from '@/server/chantiers/domain/DecisionStrategique.interface';
import { DécisionStratégiqueRepository } from '@/server/chantiers/domain/ports/DecisionStrategiqueRepository';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';

type Dependencies = {
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
};

export class CréerUneDécisionStratégiqueUseCase {
  private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository;
  
  constructor({ décisionStratégiqueRepository }: Dependencies) {
    this.décisionStratégiqueRepository = décisionStratégiqueRepository;
  }

  async run(chantierId: Chantier['id'], contenu: string, auteur_id: string, habilitations: Habilitations): Promise<DécisionStratégique> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(chantierId, 'NAT-FR');

    const date = new Date();
    const id = randomUUID();
    const type = 'suiviDesDécisionsStratégiques';
    return this.décisionStratégiqueRepository.créer(chantierId, id, contenu, type, auteur_id, date);
  }
}
