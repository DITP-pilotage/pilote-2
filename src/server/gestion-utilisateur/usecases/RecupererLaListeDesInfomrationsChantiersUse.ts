import { ChantierRepository } from '@/server/gestion-utilisateur/domain/ports/ChantierRepository';
import { InformationChantierUtilisateur } from '@/server/gestion-utilisateur/domain/InformationChantierUtilisateur';

interface Dependencies {
  chantierRepository: ChantierRepository
}

export class RecupererLaListeDesInfomrationsChantiersUse {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository } : Dependencies) {
    this.chantierRepository = chantierRepository;
  }

  async run(): Promise<InformationChantierUtilisateur[]> {
    return this.chantierRepository.listerInformationsChantiersUtilisateurs();
  }
}
