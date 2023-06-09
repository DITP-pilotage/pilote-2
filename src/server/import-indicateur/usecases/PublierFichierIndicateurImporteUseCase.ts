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
      // En arrivant ici on a déjà vérifié les valeurs par validata, on est donc sur que les valeurs sont présentes d'où le as string
      // TODO: Pour plus de clarté on pourrait créer un nouveau type MesureIndicateurTemporaireVerifie avec des valeurs figés à string
      IndicateurData.createIndicateurData({
        rapportId: mesureIndicateurTemporaire.rapportId,
        zoneId: mesureIndicateurTemporaire.zoneId as string,
        indicId: mesureIndicateurTemporaire.indicId as string,
        metricType: mesureIndicateurTemporaire.metricType as string,
        metricDate: mesureIndicateurTemporaire.metricDate as string,
        metricValue: mesureIndicateurTemporaire.metricValue as string,
      }),
    );

    await this.mesureIndicateurRepository.sauvegarder(listeIndicateursData);

    await this.mesureIndicateurTemporaireRepository.supprimerToutParRapportId(rapportId);
  }
}
