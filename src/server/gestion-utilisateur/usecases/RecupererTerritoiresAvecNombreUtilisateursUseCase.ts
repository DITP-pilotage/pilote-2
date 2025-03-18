import { TerritoireAvecNombreUtilisateurs } from '@/server/domain/territoire/Territoire.interface';
import { TerritoireRepository } from '@/server/gestion-utilisateur/domain/ports/TerritoireRepository';
import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';

interface Dependencies {
  territoireRepository: TerritoireRepository;
  utilisateurRepository: UtilisateurRepository;
}

export class RecupererTerritoiresAvecNombreUtilisateursUseCase {
  private territoireRepository: TerritoireRepository;

  private utilisateurRepository: UtilisateurRepository;

  constructor({ territoireRepository, utilisateurRepository }: Dependencies) {
    this.territoireRepository = territoireRepository;
    this.utilisateurRepository = utilisateurRepository;
  }

  async run({ territoireCodes }: { territoireCodes: string[] | null } ): Promise<TerritoireAvecNombreUtilisateurs[]> {
    const territoires = await this.territoireRepository.lister(territoireCodes || []);

    const nombresUtilisateur = await this.utilisateurRepository.récupérerNombreUtilisateursParTerritoires(territoires);

    return territoires.map(territoire => {
      return {
        ...territoire,
        nombreUtilisateur: nombresUtilisateur[territoire.code],
      };
    });

  }
}
