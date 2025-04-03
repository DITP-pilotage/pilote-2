import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { RepartitionMeteoChantiers } from '@/server/chantiers/domain/RepartitionMeteoChantiers';
import { Axe } from '@/server/chantiers/domain/Axe';
import { Habilitation } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';

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

    return this.chantierRepository.recupererLaRepartitionMeteo(chantiersLecture, territoireCode, filtres);
  }
}
