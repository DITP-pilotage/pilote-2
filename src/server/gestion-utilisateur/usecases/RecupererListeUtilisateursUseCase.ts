import { UtilisateurListeGestion } from "@/server/gestion-utilisateur/domain/UtilisateurListeGestion.interface";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";
import { ChantierRepository } from "@/server/gestion-utilisateur/domain/ports/ChantierRepository";

interface Dependencies {
  utilisateurRepository: UtilisateurRepository;
  territoireRepository: TerritoireRepository;
  chantierRepository: ChantierRepository;
  perimetreMinisterielRepository: PerimetreMinisterielRepository;
}

export class RecupererListeUtilisateursUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private territoireRepository: TerritoireRepository;

  private chantierRepository: ChantierRepository;

  private perimetreMinisterielRepository: PerimetreMinisterielRepository;

  constructor({
    utilisateurRepository,
    territoireRepository,
    perimetreMinisterielRepository,
    chantierRepository,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.territoireRepository = territoireRepository;
    this.chantierRepository = chantierRepository;
    this.perimetreMinisterielRepository = perimetreMinisterielRepository;
  }

  async run({
    sorting,
    valeurDeLaRecherche,
  }: {
    sorting: { id: string; desc: boolean }[];
    valeurDeLaRecherche: string;
  }): Promise<UtilisateurListeGestion[]> {
    const listeInformationsChantiersUtilisateurs =
      await this.chantierRepository.listerInformationsChantiersUtilisateurs();
    const listeTerritoiresCodes = await this.territoireRepository.listerCodes(
      [],
    );
    const listePerimetresMinisteriels =
      await this.perimetreMinisterielRepository.listerIds([]);

    return this.utilisateurRepository.recupererTous({
      sorting,
      valeurDeLaRecherche,
      listeTerritoiresCodes,
      listePerimetresMinisteriels,
      listeInformationsChantiersUtilisateurs,
    });
  }
}
