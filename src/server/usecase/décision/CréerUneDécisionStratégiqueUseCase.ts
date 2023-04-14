import { randomUUID } from 'node:crypto';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import DécisionStratégique from '@/server/domain/décisionStratégique/DécisionStratégique.interface';
import DécisionStratégiqueRepository from '@/server/domain/décisionStratégique/DécisionStratégiqueRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class CréerUneDécisionStratégiqueUseCase {
  constructor(
    private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository = dependencies.getDécisionStratégiqueRepository(),
  ) {}

  async run(chantierId: Chantier['id'], contenu: string, auteur: string): Promise<DécisionStratégique> {
    const date = new Date();
    const id = randomUUID();
    const type = 'suivi_des_decisions';
    return this.décisionStratégiqueRepository.créer(chantierId, id, contenu, type, auteur, date);
  }
}
