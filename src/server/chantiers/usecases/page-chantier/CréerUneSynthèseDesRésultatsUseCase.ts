import { randomUUID } from 'node:crypto';
import { SyntheseDesResultatsRepository } from '@/server/chantiers/domain/ports/SyntheseDesResultatsRepository';
import { Météo } from '@/server/chantiers/domain/Meteo';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { SyntheseDesResultats } from '@/server/chantiers/domain/SyntheseDesResultats';

type Dependencies = {
  synthèsesDesRésultatsRepository: SyntheseDesResultatsRepository;
  chantierRepository: ChantierRepository;
};

export class CréerUneSynthèseDesRésultatsUseCase {
  private readonly synthèsesDesRésultatsRepository: SyntheseDesResultatsRepository;

  private readonly chantierRepository: ChantierRepository;

  constructor({
    synthèsesDesRésultatsRepository,
    chantierRepository,
  }: Dependencies) {
    this.synthèsesDesRésultatsRepository = synthèsesDesRésultatsRepository;
    this.chantierRepository = chantierRepository;
  }

  async run(chantierId: string, territoireCode: string, contenu: string, auteur_id: string, météo: Météo, habilitations: Habilitations): Promise<SyntheseDesResultats> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(chantierId, territoireCode);
    
    const date = new Date();
    const id = randomUUID();
   
    const [, synthèseDesRésultatsCréée] = await Promise.all([
      this.chantierRepository.modifierMétéo(chantierId, territoireCode, météo),
      this.synthèsesDesRésultatsRepository.créer(chantierId, territoireCode, id, contenu, auteur_id, météo, date),
    ]);
    return synthèseDesRésultatsCréée;
  }
}
