import {
  MesureIndicateurRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface';

import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import { PropositionValeurActuelleRepository } from '@/server/import-indicateur/domain/ports/PropositionValeurActuelleRepository';

interface Dependencies {
  mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository
  mesureIndicateurRepository: MesureIndicateurRepository
  rapportRepository: RapportRepository
  propositionValeurActuelleRepository: PropositionValeurActuelleRepository
}

export class PublierFichierIndicateurImporteUseCase {
  private mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;

  private mesureIndicateurRepository: MesureIndicateurRepository;

  private propositionValeurActuelleRepository: PropositionValeurActuelleRepository;

  constructor({ mesureIndicateurTemporaireRepository, mesureIndicateurRepository, propositionValeurActuelleRepository }: Dependencies) {
    this.mesureIndicateurTemporaireRepository = mesureIndicateurTemporaireRepository;
    this.mesureIndicateurRepository = mesureIndicateurRepository;
    this.propositionValeurActuelleRepository = propositionValeurActuelleRepository;
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

    const listeValeursAvancementImportees = listeIndicateursData.filter(indicateur => indicateur.metricType === 'va');
    
    await this.mesureIndicateurRepository.sauvegarder(listeIndicateursData);
    await Promise.all(
      listeValeursAvancementImportees.map(valeurAvancement => this.propositionValeurActuelleRepository.modifierStatutPropositionsValeurActuelleApresImport({ 
        indicId: valeurAvancement.indicId, 
        zoneId: valeurAvancement.zoneId, 
        dateValeurImportee: new Date(valeurAvancement.metricDate),
        valeurImportee: Number.parseFloat(valeurAvancement.metricValue),
      })),
    );
    await this.mesureIndicateurTemporaireRepository.supprimerToutParRapportId(rapportId);
  }
}
