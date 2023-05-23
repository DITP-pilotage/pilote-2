import {
  MesureIndicateurRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface';

import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';

interface Dependencies {
  mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository
  mesureIndicateurRepository: MesureIndicateurRepository
  rapportRepository: RapportRepository;
}

export class PublierFichierIndicateurImporteUseCase {
  private mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;

  private mesureIndicateurRepository: MesureIndicateurRepository;

  private rapportRepository: RapportRepository;


  constructor({ mesureIndicateurTemporaireRepository, mesureIndicateurRepository, rapportRepository }: Dependencies) {
    this.mesureIndicateurTemporaireRepository = mesureIndicateurTemporaireRepository;
    this.mesureIndicateurRepository = mesureIndicateurRepository;
    this.rapportRepository = rapportRepository;
  }

  async execute({ rapportId }: { rapportId: string }): Promise<void> {
    const listeMesuresIndicateurTemporaire = await this.mesureIndicateurTemporaireRepository.recupererToutParRapportId(rapportId);

    const listeIndicateursData = listeMesuresIndicateurTemporaire.map(mesureIndicateurTemporaire =>
      IndicateurData.createIndicateurData({
        rapportId: mesureIndicateurTemporaire.rapportId,
        zoneId: mesureIndicateurTemporaire.zoneId,
        indicId: mesureIndicateurTemporaire.indicId,
        metricType: mesureIndicateurTemporaire.metricType,
        metricDate: mesureIndicateurTemporaire.metricDate,
        metricValue: mesureIndicateurTemporaire.metricValue,
      }),
    );

    await this.mesureIndicateurRepository.sauvegarder(listeIndicateursData);

    await this.mesureIndicateurTemporaireRepository.supprimerToutParRapportId(rapportId);
  }
}
