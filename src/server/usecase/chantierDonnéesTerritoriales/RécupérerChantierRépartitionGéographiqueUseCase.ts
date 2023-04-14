import { dependencies } from '@/server/infrastructure/Dependencies';
import ChantierDonnéesTerritorialesRepository
  from '@/server/infrastructure/accès_données/chantierDonnéesTerritoriales/ChantierDonnéesTerritorialesRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import {
  DonnéesTerritoriales,
} from '@/server/domain/chantierDonnéesTerritoriales/chantierDonnéesTerritoriales.interface';

export default class RécupérerChantierRépartitionGéographiqueUseCase {
  constructor(
    private readonly chantierDonnéesTerritorialesRepository: ChantierDonnéesTerritorialesRepository = dependencies.getChantierDonnéesTerritorialesRepository(),
  ) {}

  async run(chantierId: string): Promise<Record<Maille, Record<CodeInsee, DonnéesTerritoriales>>> {
    return this.chantierDonnéesTerritorialesRepository.récupérerTousLesAvancementsDUnChantier(chantierId);
  }
}
