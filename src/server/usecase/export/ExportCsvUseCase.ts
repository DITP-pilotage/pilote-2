import { Habilitation, SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';

export class ExportCsvUseCase {
  constructor(
    private readonly chantierRepository = dependencies.getChantierRepository(),
  ) {}

  public async run(habilitation: Habilitation): Promise<ChantierPourExport[]> {
    const chantiers = await this.chantierRepository.getListe(habilitation, SCOPE_LECTURE);
    let result: ChantierPourExport[] = [];
    for (const chantier of chantiers) {
      // eslint-disable-next-line unicorn/prefer-spread
      result = result.concat(ChantierPourExport.fromChantier(chantier));
    }
    return result;
  }
}
