import { ChantierRepository } from "@/server/gestion-utilisateur/domain/ports/ChantierRepository";
import { InformationChantierUtilisateur } from "@/server/gestion-utilisateur/domain/InformationChantierUtilisateur";
import type { Inject } from "@/server/gestion-utilisateur/module";

export class RecupererLaListeDesInfomrationsChantiersUse {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Inject<"chantierRepository">) {
    this.chantierRepository = chantierRepository;
  }

  async run(): Promise<InformationChantierUtilisateur[]> {
    return this.chantierRepository.listerInformationsChantiersUtilisateurs();
  }
}
