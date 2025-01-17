
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { FiltreQueryParams, SortingParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { RepartitionMeteoChantiers } from '@/server/chantiers/domain/RepartitionMeteoChantiers';
import Axe from '@/server/domain/axe/Axe.interface';

interface Dependencies {
  chantierRepository: ChantierRepository
}

export class RecupererMeteosChantiersUseCase {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
  }

  async run(habilitations: Habilitations, profil: ProfilCode, territoireCode: string, maille: 'DEPT' | 'REG', axes: Axe[], filtres: FiltreQueryParams, sorting: SortingParams): Promise<RepartitionMeteoChantiers> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const filtresPourChantier: FiltreQueryParams = {
      perimetres: filtres.perimetres,
      axes: filtres.axes.map(filtre => axes.find(axe => axe.id === filtre)!.nom),
      statut: filtres.statut,
      meteos: filtres.meteos,
      estTerritorialise: filtres.estTerritorialise,
      estBarometre: filtres.estBarometre,
      valeurDeLaRecherche: filtres.valeurDeLaRecherche,
    };
    let chantiers = await this.chantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLecture, territoiresLecture, territoireCode, profil, maille, filtresPourChantier, sorting );
    
    const repartitions = chantiers.filter(chantier => chantier.territoire_code === territoireCode).reduce((acc, value) => {
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
    console.log({ 'repartitions': repartitions });
    return RepartitionMeteoChantiers.creerRepartitionMeteoChantiers(repartitions);
  }
}
