import { TerritoireAvecNombreUtilisateurs } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';

export class RécupérerTerritoiresAvecNombreUtilisateursUseCase {
  private territoireRepository: TerritoireRepository;

  private utilisateurRepository: UtilisateurRepository;

  constructor({ territoireRepository, utilisateurRepository }: { territoireRepository: TerritoireRepository, utilisateurRepository: UtilisateurRepository }) {
    this.territoireRepository = territoireRepository;
    this.utilisateurRepository = utilisateurRepository;
  }

  async run({ territoireCodes }: { territoireCodes: string[] | null } ): Promise<TerritoireAvecNombreUtilisateurs[]> {
    const territoires = territoireCodes
      ? await this.territoireRepository.récupérerListe(territoireCodes)
      : await this.territoireRepository.récupérerTous();
    
    const nombresUtilisateur = await this.utilisateurRepository.récupérerNombreUtilisateursParTerritoires(territoires);

    return territoires.map(territoire => {
      return {
        ...territoire,
        nombreUtilisateur: nombresUtilisateur[territoire.code],
      };
    });

  }
}
