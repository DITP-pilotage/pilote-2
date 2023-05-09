import { IndicateurPourExport } from '@/server/domain/indicateur/IndicateurPourExport';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class ExportCsvDesIndicateursSansFiltreUseCase {

  constructor(
    private readonly indicateurRepository = dependencies.getIndicateurRepository(),
  ) {}

  run(habilitations: Habilitations): Promise<IndicateurPourExport[]> {
    return this.indicateurRepository.récupérerPourExports(habilitations);
  }

}
