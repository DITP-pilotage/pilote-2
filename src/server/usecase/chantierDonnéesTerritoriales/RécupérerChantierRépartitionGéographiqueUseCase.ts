import { dependencies } from '@/server/infrastructure/Dependencies';
import ChantierDonnéesTerritorialesRepository
  from '@/server/infrastructure/accès_données/chantierDonnéesTerritoriales/ChantierDonnéesTerritorialesRepository.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Avancement from '@/server/domain/avancement/Avancement.interface';
import SynthèseDesRésultatsRepository
  from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille, mailles } from '@/server/domain/maille/Maille.interface';
import { objectEntries } from '@/client/utils/objects/objects';

export default class RécupérerChantierRépartitionGéographiqueUseCase {
  constructor(
    private readonly chantierDonnéesTerritorialesRepository: ChantierDonnéesTerritorialesRepository = dependencies.getChantierDonnéesTerritorialesRepository(),
    private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository(),
  ) {}

  async run(chantierId: string) {
    const [chantierDonnéesTerritoriales, synthèsesDesRésultatsTerritoriales] = await Promise.all([
      this.chantierDonnéesTerritorialesRepository.récupérerTousLesAvancementsDUnChantier(chantierId),
      this.synthèseDesRésultatsRepository.récupérerLesPlusRécentesPourTousLesTerritoires(chantierId),
    ]);

    let avancementsGlobauxTerritoriaux: Record<Maille, Record<CodeInsee, Avancement['global']>> = {
      nationale: {},
      régionale: {},
      départementale: {},
    };

    let météosTerritoriales: Record<Maille, Record<CodeInsee, Météo>> = {
      nationale: {},
      régionale: {},
      départementale: {},
    };

    for (const maille of mailles) {
      for (const [codeInsee, donnéesTerritoriales] of objectEntries(chantierDonnéesTerritoriales[maille])) {
        avancementsGlobauxTerritoriaux[maille][codeInsee] = donnéesTerritoriales.avancement.global;
      }
      for (const [codeInsee, synthèseDesRésultats] of objectEntries(synthèsesDesRésultatsTerritoriales[maille])) {
        météosTerritoriales[maille][codeInsee] = synthèseDesRésultats?.météo ?? 'NON_RENSEIGNEE';
      }
    }

    return {
      avancementsGlobauxTerritoriaux,
      météosTerritoriales,
    };
  }
}
