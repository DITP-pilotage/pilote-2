import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import { RepartitionMeteoChantiers } from "@/server/chantiers/domain/RepartitionMeteoChantiers";
import Axe from "@/server/domain/axe/Axe.interface";

interface Dependencies {
  chantierRepository: ChantierRepository;
}

export class RecupererRepartitionsMeteoChantiersUseCase {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
  }

  async run(
    territoireCode: string,
    filtres: FiltreQueryParams,
    axes: Axe[],
    chantierIds: string[],
  ): Promise<RepartitionMeteoChantiers> {
    filtres.axes = filtres.axes.map(
      (filtre) => axes.find((axe) => axe.id === filtre)!.nom,
    );

    return this.chantierRepository.recupererLaRepartitionMeteo(
      chantierIds,
      territoireCode,
      filtres,
    );
  }
}
