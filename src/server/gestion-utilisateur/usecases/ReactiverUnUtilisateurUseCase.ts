import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';
import { UtilisateurIAMRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository';
import { Utilisateur } from '@/server/gestion-utilisateur/domain/Utilisateur.interface';
import { TokenAPIInformationRepository } from '@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { TerritoireRepository } from '@/server/gestion-utilisateur/domain/ports/TerritoireRepository';
import {
  PerimetreMinisterielRepository,
} from '@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository';
import { ChantierRepository } from '@/server/gestion-utilisateur/domain/ports/ChantierRepository';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

type Dependencies = {
  utilisateurRepository: UtilisateurRepository,
  chantierRepository: ChantierRepository,
  territoireRepository: TerritoireRepository,
  perimetreMinisterielRepository: PerimetreMinisterielRepository,
  utilisateurIAMRepository: UtilisateurIAMRepository,
  tokenAPIInformationRepository: TokenAPIInformationRepository,
};

export default class ReactiverUnUtilisateurUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private chantierRepository: ChantierRepository;

  private territoireRepository: TerritoireRepository;

  private perimetreMinisterielRepository: PerimetreMinisterielRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  constructor({
    utilisateurRepository,
    chantierRepository,
    territoireRepository,
    perimetreMinisterielRepository,
    utilisateurIAMRepository,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.chantierRepository = chantierRepository;
    this.territoireRepository = territoireRepository;
    this.perimetreMinisterielRepository = perimetreMinisterielRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
  }

  async run(email: Utilisateur['email'], habilitations: Habilitations, profilAuteur: Profil | null, auteurId: string): Promise<void> {
    
    const listeInformationsChantiersUtilisateurs = await this.chantierRepository.listerInformationsChantiersUtilisateurs();
    const listeTerritoiresCodes = await this.territoireRepository.listerCodes([]);
    const listePerimetresMinisteriels = await this.perimetreMinisterielRepository.listerIds([]);

    const utilisateurAReactiver = await this.utilisateurRepository.récupérer(email, listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs);

    if (!utilisateurAReactiver) {
      throw new Error("Le compte à supprimer n'existe pas.");
    }

    const habilitation = new Habilitation(habilitations);

    habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(
      utilisateurAReactiver.habilitations.lecture.chantiers, 
      utilisateurAReactiver.habilitations.lecture.territoires,
      profilAuteur,
    );

    await this.utilisateurRepository.reactiver(email, auteurId);

    if (process.env.IMPORT_KEYCLOAK_URL) {
      await this.utilisateurIAMRepository.reactive(email);
    }
  }
}
