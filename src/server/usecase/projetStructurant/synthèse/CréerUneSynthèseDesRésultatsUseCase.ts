import { randomUUID } from 'node:crypto';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultatsProjetStructurant from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';

export default class CréerUneSynthèseDesRésultatsProjetStructurantUseCase {
  constructor(
    private readonly synthèsesDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository = dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ) {}

  async run(projetStructurantId: string, territoireCode: string, contenu: string, auteur: string, météo: Météo, habilitations: Habilitations): Promise<SynthèseDesRésultatsProjetStructurant> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublicationsProjetsStructurants(territoireCode);
    
    const date = new Date();
    const id = randomUUID();
   
    const [synthèseDesRésultatsCréée] = await Promise.all([
      this.synthèsesDesRésultatsRepository.créer(projetStructurantId, id, contenu, auteur, météo, date),
    ]);
    return synthèseDesRésultatsCréée;
  }
}
