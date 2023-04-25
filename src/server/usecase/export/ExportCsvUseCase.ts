import { Habilitation } from '@/server/domain/identité/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';

export class ExportCsvUseCase {
  constructor(
    private readonly chantierRepository = dependencies.getChantierRepository(),
  ) {}

  public async run(habilitation: Habilitation): Promise<ChantierPourExport[]> {
    return this.chantierRepository.getChantiersPourExports(habilitation);
  }
}
