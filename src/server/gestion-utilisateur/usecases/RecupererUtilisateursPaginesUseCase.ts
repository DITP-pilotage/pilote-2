import { PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE } from "@/server/domain/utilisateur/profils-gestion-utilisateur";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
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

export class RecupererUtilisateursPaginesUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private territoireRepository: TerritoireRepository;

  private chantierRepository: ChantierRepository;

  private perimetreMinisterielRepository: PerimetreMinisterielRepository;

  constructor({
    utilisateurRepository,
    territoireRepository,
    chantierRepository,
    perimetreMinisterielRepository,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.territoireRepository = territoireRepository;
    this.chantierRepository = chantierRepository;
    this.perimetreMinisterielRepository = perimetreMinisterielRepository;
  }

  async run({
    sorting,
    valeurDeLaRecherche,
    filtres,
    pagination,
    viewerProfil,
    viewerHabilitations,
  }: {
    sorting: { id: string; desc: boolean }[];
    valeurDeLaRecherche: string;
    filtres: {
      territoires: string[];
      perimetresMinisteriels: string[];
      chantiers: string[];
      chantiersAssociésAuxPérimètres: string[];
      profils: string[];
      typeCompte: ("actif" | "desactive")[];
    };
    pagination: { pageIndex: number; pageSize: number };
    viewerProfil: ProfilCode;
    viewerHabilitations: {
      gestionUtilisateur: {
        territoires: string[];
        chantiers: string[];
      };
    };
  }): Promise<{ utilisateurs: UtilisateurListeGestion[]; totalCount: number }> {
    const profilsAutorisés = this.calculerProfilsAutorisés(viewerProfil);

    // Quand le viewer n'est pas restreint (profilsAutorisés = null),
    // on bypass toutes les autorisations (comme dans l'ancien FiltrerListeUtilisateursUseCase.utilisateurEstAutorisé)
    const territoiresAutorisés =
      profilsAutorisés !== null
        ? viewerHabilitations.gestionUtilisateur.territoires
        : null;
    const chantiersAutorisés =
      profilsAutorisés !== null
        ? viewerHabilitations.gestionUtilisateur.chantiers
        : null;

    const { utilisateurIds, totalCount } =
      await this.utilisateurRepository.recupererFiltresEtPagines({
        sorting,
        valeurDeLaRecherche,
        filtres,
        autorisations: {
          profilsAutorisés,
          territoiresAutorisés,
          chantiersAutorisés,
        },
        pagination,
      });

    const [
      listeTerritoiresCodes,
      listePerimetresMinisteriels,
      listeInformationsChantiersUtilisateurs,
    ] = await Promise.all([
      this.territoireRepository.listerCodes([]),
      this.perimetreMinisterielRepository.listerIds([]),
      this.chantierRepository.listerInformationsChantiersUtilisateurs(),
    ]);

    const utilisateurs = await this.utilisateurRepository.recupererParIds({
      ids: utilisateurIds,
      listeTerritoiresCodes,
      listePerimetresMinisteriels,
      listeInformationsChantiersUtilisateurs,
    });

    return { utilisateurs, totalCount };
  }

  private calculerProfilsAutorisés(viewerProfil: ProfilCode): string[] | null {
    if (
      !Object.keys(PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE).includes(
        viewerProfil,
      )
    ) {
      return null;
    }
    return PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE[
      viewerProfil as keyof typeof PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE
    ];
  }
}
