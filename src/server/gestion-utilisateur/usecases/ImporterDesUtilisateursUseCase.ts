import { objectEntries } from "@/client/utils/objects/objects";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { UtilisateurÀCréerOuMettreÀJourSansHabilitation } from "@/server/domain/utilisateur/Utilisateur.interface";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { HabilitationsÀCréerOuMettreÀJourCalculées } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { ChantierRepository } from "@/server/gestion-utilisateur/domain/ports/ChantierRepository";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
  utilisateurIAMRepository: UtilisateurIAMRepository;
  territoireRepository: TerritoireRepository;
  chantierRepository: ChantierRepository;
  perimetreMinisterielRepository: PerimetreMinisterielRepository;
};

export default class ImporterDesUtilisateursUseCase {
  private readonly utilisateurRepository: UtilisateurRepository;

  private readonly utilisateurIAMRepository: UtilisateurIAMRepository;

  private readonly territoireRepository: TerritoireRepository;

  private readonly chantierRepository: ChantierRepository;

  private readonly perimetreMinisterielRepository: PerimetreMinisterielRepository;

  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
    territoireRepository,
    chantierRepository,
    perimetreMinisterielRepository,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.territoireRepository = territoireRepository;
    this.chantierRepository = chantierRepository;
    this.perimetreMinisterielRepository = perimetreMinisterielRepository;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async run(
    utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & {
      habilitations: HabilitationsÀCréerOuMettreÀJourCalculées;
      auteurEmail: string;
    })[],
  ): Promise<void> {
    const listeInformationsChantiersUtilisateurs =
      await this.chantierRepository.listerInformationsChantiersUtilisateurs();
    const listeTerritoiresCodes = await this.territoireRepository.listerCodes(
      [],
    );
    const listePerimetresMinisteriels =
      await this.perimetreMinisterielRepository.listerIds([]);

    for (const utilisateur of utilisateurs) {
      const territoires = await this.territoireRepository.lister([]);

      // FIXME:
      // ATTENTION CE USECASE N'IMPLEMENTE PAS TOUTES LES REGLES DE VERIFICATION DE LA COHERENCE ENTRE LES INFORMATIONS FOURNIES ET LES PROFILS
      // SE REFERER AU USECASE CREER OU METTRE A JOUR UN UTILISATEUR POUR L'ENSEMBLE DES REGLES
      // IL EXISTE UNIQUEMENT CAR LE FORMULAIRE N'EST PAS ENCORE UTILISE ET AFIN QUE L'ON PUISSE CONTINUER A IMPLEMENTER CERTAINS DROITS CUSTOM
      // A SUPPRIMER DES QUE POSSIBLE POUR EVITER DES ERREURS :)

      for (const habilitation of objectEntries(utilisateur.habilitations)) {
        // AJOUTER LE PERIMETRE OUTRE MER POUR LES PROFILS DROM
        if (
          utilisateur.profil === ProfilEnum.DROM &&
          !utilisateur.habilitations[habilitation[0]].périmètres.includes(
            "PER-018",
          )
        ) {
          utilisateur.habilitations[habilitation[0]].périmètres = [
            ...utilisateur.habilitations[habilitation[0]].périmètres,
            "PER-018",
          ];
        }

        habilitation[1].territoires.forEach((territoireCode, index) => {
          // TRANSFORMER LE NAT EN NAT-FR
          if (territoireCode === "NAT") {
            utilisateur.habilitations[habilitation[0]].territoires[index] =
              "NAT-FR";
          }

          // TRANSFORMER LE TOUS EN UNE LISTE DE TOUS LES TERRITOIRES
          if (territoireCode === "TOUS") {
            utilisateur.habilitations[habilitation[0]].territoires =
              territoires.map((territoire) => territoire.code);
            return;
          }

          // AJOUTER AUTOMATIQUEMENT LES DEPARTEMENTS ENFANTS
          if (/^REG-.*/.test(territoireCode)) {
            const territoiresEnfants = territoires.filter(
              (territoire) => territoire.codeParent === territoireCode,
            );
            const territoireCodeEnfants = territoiresEnfants.map(
              (territoire) => territoire.code,
            );
            utilisateur.habilitations[habilitation[0]].territoires = [
              ...utilisateur.habilitations[habilitation[0]].territoires,
              ...territoireCodeEnfants,
            ];
          }
        });
      }

      const auteur = await this.utilisateurRepository.récupérer(
        utilisateur.auteurEmail,
        listeTerritoiresCodes,
        listePerimetresMinisteriels,
        listeInformationsChantiersUtilisateurs,
      );
      const auteurGenerique = await this.utilisateurRepository.récupérer(
        "import.csv@modernisation.gouv.fr",
        listeTerritoiresCodes,
        listePerimetresMinisteriels,
        listeInformationsChantiersUtilisateurs,
      );
      await this.utilisateurRepository.créerOuMettreÀJour(
        utilisateur,
        auteur ? auteur.id : auteurGenerique!.id,
      );
    }
    const utilisateursPourIAM = utilisateurs.map((utilisateur) => ({
      nom: utilisateur.nom,
      prénom: utilisateur.prénom,
      email: utilisateur.email,
    }));
    await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
  }
}
