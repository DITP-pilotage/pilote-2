import { TerritoireAvecNombreUtilisateurs } from "@/shared/territoire/Territoire.interface";
import { TerritoireRepository } from "@/server/gestion-utilisateur/infrastructure/sql/TerritoireRepository.interface";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/infrastructure/sql/UtilisateurRepository.interface";

export class RecupererTerritoiresAvecNombreUtilisateursSQLUseCase {
  private territoireRepository: TerritoireRepository;

  private utilisateurRepository: UtilisateurRepository;

  constructor({
    territoireRepository,
    utilisateurRepository,
  }: {
    territoireRepository: TerritoireRepository;
    utilisateurRepository: UtilisateurRepository;
  }) {
    this.territoireRepository = territoireRepository;
    this.utilisateurRepository = utilisateurRepository;
  }

  async run({
    territoireCodes,
  }: {
    territoireCodes: string[] | null;
  }): Promise<TerritoireAvecNombreUtilisateurs[]> {
    const territoires = territoireCodes
      ? await this.territoireRepository.récupérerListe(territoireCodes)
      : await this.territoireRepository.récupérerTous();

    const nombresUtilisateur =
      await this.utilisateurRepository.récupérerNombreUtilisateursParTerritoires(
        territoires,
      );

    return territoires.map((territoire) => {
      return {
        ...territoire,
        nombreUtilisateur: nombresUtilisateur[territoire.code],
      };
    });
  }
}
