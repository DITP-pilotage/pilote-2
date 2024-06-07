import { MailleInterne } from '@/server/domain/maille/Maille.interface';
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
    
    // eslint-disable-next-line sonarjs/prefer-immediate-return
    const territoiresAvecNombreUtilisateur = await Promise.all(territoires.map(async territoire => {
      const nombreUtilisateur = await this.utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire(territoire.code, territoire.maille as MailleInterne);
      return {
        ...territoire,
        nombreUtilisateur,
      };
    }));

    return territoiresAvecNombreUtilisateur;

  }
}
