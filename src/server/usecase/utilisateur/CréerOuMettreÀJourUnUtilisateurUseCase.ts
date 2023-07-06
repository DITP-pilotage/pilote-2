import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { UtilisateurÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/Utilisateur.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { Habilitations, HabilitationsÀCréerOuMettreÀJourCalculées } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import créerValidateurHabilitations from '@/validation/habilitation';
import { codesTerritoiresDROM } from '@/validation/utilisateur';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class CréerOuMettreÀJourUnUtilisateurUseCase {
  constructor(
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository = dependencies.getUtilisateurIAMRepository(),
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async _validerLesHabilitations(utilisateur: UtilisateurÀCréerOuMettreÀJour) {
    const territoires = await this.territoireRepository.récupérerTous();
    const chantiers = await this.chantierRepository.récupérerChantiersSynthétisés();

    const validateurHabilitations = créerValidateurHabilitations(territoires, chantiers);
    validateurHabilitations.parse({ profil: utilisateur.profil, habilitations: utilisateur.habilitations });
  }

  async _définirLesHabilitations(utilisateur: UtilisateurÀCréerOuMettreÀJour): Promise<HabilitationsÀCréerOuMettreÀJourCalculées> {
    return {
      lecture: {
        chantiers: utilisateur.habilitations?.lecture?.chantiers ?? [],
        territoires: utilisateur.profil === 'DROM' ? codesTerritoiresDROM : utilisateur.habilitations?.lecture?.territoires ?? [],
        périmètres:  utilisateur.profil === 'DROM' ? ['PER-018'] : utilisateur.habilitations?.lecture?.périmètres ?? [],
      },
      'saisie.indicateur': {
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      'saisie.commentaire': {
        chantiers: [],
        territoires: ['DITP_PILOTAGE', 'SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM'].includes(utilisateur.profil) ? ['NAT-FR'] : utilisateur.habilitations?.lecture?.territoires ?? [],
        périmètres: [],
      },
    };
  }

  async _vérifierExistenceUtilisateur(email: string, utilisateurExistant: boolean) {
    const utilisateurExiste = await this.utilisateurRepository.récupérer(email);

    if (utilisateurExistant && !utilisateurExiste) 
      throw new Error("L'utilisateur a modifier n'existe pas");
    
    if (!utilisateurExistant && utilisateurExiste)
      throw new Error("L'utilisateur existe déjà");
  }

  async run(utilisateur: UtilisateurÀCréerOuMettreÀJour, auteurModification: string, utilisateurExistant: boolean, habilitations: Habilitations): Promise<void> {
    await this._validerLesHabilitations(utilisateur);
    const habilitationsFormatées = await this._définirLesHabilitations(utilisateur);

    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(habilitationsFormatées.lecture.chantiers, habilitationsFormatées.lecture.territoires);

    await this._vérifierExistenceUtilisateur(utilisateur.email, utilisateurExistant);

    await this.utilisateurRepository.créerOuMettreÀJour({ ...utilisateur, habilitations: habilitationsFormatées }, auteurModification);

    if (process.env.IMPORT_KEYCLOAK_URL) {
      const utilisateursPourIAM = [{ nom: utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }];
      await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
    }
  }
}
