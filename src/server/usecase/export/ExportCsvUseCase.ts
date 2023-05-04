import { dependencies } from '@/server/infrastructure/Dependencies';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export class ExportCsvUseCase {
  constructor(
    private readonly chantierRepository = dependencies.getChantierRepository(),
  ) {}

  public async run(habilitations: Habilitations): Promise<ChantierPourExport[]> {
    return this.chantierRepository.getChantiersPourExports(habilitations);
  }
}
