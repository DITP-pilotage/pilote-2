import { dependencies } from '@/server/infrastructure/Dependencies';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export class ExportCsvUseCase {
  constructor(
    private readonly chantierRepository = dependencies.getChantierRepository(),
  ) {}

  public async run(habilitation: Utilisateur['scopes']): Promise<ChantierPourExport[]> {
    return this.chantierRepository.getChantiersPourExports(habilitation);
  }
}
