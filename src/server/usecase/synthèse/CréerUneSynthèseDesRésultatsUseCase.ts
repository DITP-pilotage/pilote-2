import { randomUUID } from 'node:crypto';
import { dependencies } from '@/server/infrastructure/Dependencies';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

export default class CréerUneSynthèseDesRésultatsUseCase {
  constructor(
    private readonly synthèsesDesRésultatsRepository: SynthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository(),
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee, contenu: string, auteur: string, météo: Météo): Promise<SynthèseDesRésultats> {
    const date = new Date();
    const id = randomUUID();
    const [, synthèseDesRésultatsCréée] = await Promise.all([
      this.chantierRepository.modifierMétéo(chantierId, maille, codeInsee, météo),
      this.synthèsesDesRésultatsRepository.créer(chantierId, maille, codeInsee, id, contenu, auteur, météo, date),
    ]);
    return synthèseDesRésultatsCréée;
  }
}
