import { randomUUID } from 'node:crypto';
import { dependencies } from '@/server/infrastructure/Dependencies';
import SynthèseDesRésultatsRepository from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class CréerUneSynthèseDesRésultatsUseCase {
  constructor(
    private readonly synthèsesDesRésultatsRepository: SynthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository(),
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(chantierId: string, territoireCode: string, contenu: string, auteur: string, météo: Météo, habilitations: Habilitations): Promise<SynthèseDesRésultats> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(chantierId, territoireCode);
    
    const date = new Date();
    const id = randomUUID();
   
    const [, synthèseDesRésultatsCréée] = await Promise.all([
      this.chantierRepository.modifierMétéo(chantierId, territoireCode, météo),
      this.synthèsesDesRésultatsRepository.créer(chantierId, territoireCode, id, contenu, auteur, météo, date),
    ]);
    return synthèseDesRésultatsCréée;
  }
}
