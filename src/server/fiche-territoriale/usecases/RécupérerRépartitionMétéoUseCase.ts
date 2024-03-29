import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { RepartitionMeteo } from '@/server/fiche-territoriale/domain/RepartitionMeteo';
import { CHANTIER_EXCLUS } from '@/server/fiche-territoriale/domain/CHANTIER_EXCLUS';

interface Dependencies {
  chantierRepository: ChantierRepository
  territoireRepository: TerritoireRepository
}

export class RécupérerRépartitionMétéoUseCase {
  private chantierRepository: ChantierRepository;

  private territoireRepository: TerritoireRepository;

  constructor({ chantierRepository, territoireRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
    this.territoireRepository = territoireRepository;
  }

  async run({ territoireCode }: { territoireCode: string }): Promise<RepartitionMeteo> {
    const territoire = await this.territoireRepository.recupererTerritoireParCode({ territoireCode });

    let chantiers = territoire.maille !== 'NAT' ? (await this.chantierRepository.listerParTerritoireCodePourEtMaille({ territoireCode, maille: territoire.maille }).then(chantiersResult => chantiersResult.filter(chantier => !CHANTIER_EXCLUS[territoire.maille].has(chantier.id)))) : [];

    const repartitions = chantiers.reduce((acc, value) => {
      switch (value.meteo) {
        case 'ORAGE': {
          acc.nombreOrage += 1;
          break;
        }
        case 'COUVERT': {
          acc.nombreCouvert += 1;
          break;
        }
        case 'NUAGE': {
          acc.nombreNuage += 1;
          break;
        }
        case 'SOLEIL': {
          acc.nombreSoleil += 1;
          break;
        }
      }
      return acc;
    }, {
      nombreOrage: 0,
      nombreCouvert: 0,
      nombreNuage: 0,
      nombreSoleil: 0,
    });

    return RepartitionMeteo.creerRepartitionMeteo(repartitions);
  }
}
