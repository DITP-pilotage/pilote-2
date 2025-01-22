
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { RepartitionMeteoChantiers } from '@/server/chantiers/domain/RepartitionMeteoChantiers';
import Axe from '@/server/domain/axe/Axe.interface';

interface Dependencies {
  chantierRepository: ChantierRepository
}

export class RecupererRepartitionsMeteoChantiersUseCase {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
  }

  async run(habilitations: Habilitations, territoireCode: string, filtres: FiltreQueryParams, axes: Axe[]): Promise<RepartitionMeteoChantiers> {
    const habilitation = new Habilitation(habilitations);
    filtres.axes = filtres.axes.map(filtre => axes.find(axe => axe.id === filtre)!.nom);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();

    // eslint-disable-next-line sonarjs/prefer-immediate-return
    const repartitions = await this.chantierRepository.recupererLaRepartitionMeteo(chantiersLecture, territoireCode, filtres);

    return repartitions;
  }
}
