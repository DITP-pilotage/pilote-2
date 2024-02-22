import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { RepartitionMeteo } from '@/server/fiche-territoriale/domain/RepartitionMeteo';
import { Chantier } from '@/server/fiche-territoriale/domain/Chantier';

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
    let chantiers: Chantier[];

    if (territoire.maille === 'DEPT') {
      chantiers = await this.chantierRepository.listerParTerritoireCodePourUnDepartement({ territoireCode });
    } else if (territoire.maille === 'REG') {
      chantiers = await this.chantierRepository.listerParTerritoireCodePourUneRegion({ territoireCode });
    } else {
      chantiers = [];
    }

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
