import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { CHANTIER_EXCLUS } from '@/server/fiche-territoriale/domain/CHANTIER_EXCLUS';

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

    let chantiers = territoire.maille !== 'NAT' ? (await this.chantierRepository.listerParTerritoireCodePourEtMaille({ territoireCode, maille: territoire.maille }).then(chantiersResult => chantiersResult.filter(chantier => !CHANTIER_EXCLUS[territoire.maille].has(chantier.id)))) : [];

    return chantiers.map(chantier => chantier.tauxAvancementAnnuel);
  }
}
