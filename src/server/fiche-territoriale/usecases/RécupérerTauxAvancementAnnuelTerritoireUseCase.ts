import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { Chantier } from '@/server/fiche-territoriale/domain/Chantier';

interface Dependencies {
  chantierRepository: ChantierRepository
  territoireRepository: TerritoireRepository
}

const CHANTIER_EXCLUS = new Set(['CH-162', 'CH-173', 'CH-054', 'CH-006', 'CH-057', 'CH-086', 'CH-107', 'CH-141', 'CH-130', 'CH-131']);

export class RécupérerTauxAvancementAnnuelTerritoireUseCase {
  private chantierRepository: ChantierRepository;

  private territoireRepository: TerritoireRepository;

  constructor({ chantierRepository, territoireRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
    this.territoireRepository = territoireRepository;
  }

  async run({ territoireCode }: { territoireCode: string }): Promise<(number | null)[]> {
    const territoire = await this.territoireRepository.recupererTerritoireParCode({ territoireCode });
    let chantiers: Chantier[];

    if (territoire.maille === 'DEPT') {
      chantiers = await this.chantierRepository.listerParTerritoireCodePourUnDepartement({ territoireCode }).then(chantiersResult => chantiersResult.filter(chantier => !CHANTIER_EXCLUS.has(chantier.id)));
    } else if (territoire.maille === 'REG') {
      chantiers = await this.chantierRepository.listerParTerritoireCodePourUneRegion({ territoireCode }).then(chantiersResult => chantiersResult.filter(chantier => !CHANTIER_EXCLUS.has(chantier.id)));
    } else {
      chantiers = [];
    }
    return chantiers.map(chantier => chantier.tauxAvancementAnnuel);
  }
}
