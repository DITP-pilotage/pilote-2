import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { Chantier } from '@/server/fiche-territoriale/domain/Chantier';

interface Dependencies {
  chantierRepository: ChantierRepository
  territoireRepository: TerritoireRepository
}

export class RécupérerTauxAvancementAnnuelTerritoireUseCase {
  private chantierRepository: ChantierRepository;

  private territoireRepository: TerritoireRepository;

  constructor({ chantierRepository, territoireRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
    this.territoireRepository = territoireRepository;
  }

  async run({ territoireCode }: { territoireCode: string }): Promise<(number | null)[]> {
    const territoire = await this.territoireRepository.recupererTerritoireParCode({ territoireCode });
    let chantiers: Chantier[] = [];

    if (territoire.maille === 'DEPT') {
      chantiers = await this.chantierRepository.listerParTerritoireCodePourUnDepartement({ territoireCode });
    } else if (territoire.maille === 'REG') {
      chantiers = await this.chantierRepository.listerParTerritoireCodePourUneRegion({ territoireCode });
    } else {
      chantiers = [];
    }
    return chantiers.map(chantier => chantier.tauxAvancementAnnuel);
  }
}
