import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierFixture from '@/fixtures/ChantierFixture';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export default class ChantierRandomRepository implements ChantierRepository {
  private readonly valeursFixes: Partial<Chantier>[] | undefined;

  constructor(valeursFixes?: Partial<Chantier>[]) {
    this.valeursFixes = valeursFixes;
  }

  async getById(id: string): Promise<Chantier> {
    return ChantierFixture.générer({ id, ...this.valeursFixes?.[0] });
  }

  async getListe(): Promise<Chantier[]> {
    if (!this.valeursFixes) {
      return [];
    }
    return ChantierFixture.générerPlusieurs(this.valeursFixes.length, this.valeursFixes);
  }

  récupérerMétéoParChantierIdEtTerritoire(_chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<Météo | null> {
    throw new Error('Not Implemented');
  }
}
