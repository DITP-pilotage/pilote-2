import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { UtilisateurÀCréerOuMettreÀJour, profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { Habilitations, HabilitationsÀCréerOuMettreÀJourCalculées } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { codesTerritoiresDROM } from '@/validation/utilisateur';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default class CréerOuMettreÀJourUnUtilisateurUseCase {
  constructor(
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository = dependencies.getUtilisateurIAMRepository(),
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
    private readonly périmètreMinistérielRepository: PérimètreMinistérielRepository = dependencies.getPérimètreMinistérielRepository(),
  ) {}

  private _déterminerChantiersAccessiblesEnLecture(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: ChantierSynthétisé[]): string[] {
    const touslesChantiersIds = new Set(chantiers.map(chantier => chantier.id));
    const touslesChantiersTerritorialisésIds = new Set(chantiers.filter(chantier => chantier.estTerritorialisé).map(chantier => chantier.id));

    const chantiersPasEnDoublonsAvecLesPérimètres = utilisateur.habilitations.lecture.chantiers.filter(chantierId => {
      const chantier = chantiers.find(c => c.id === chantierId);
      return utilisateur.habilitations.lecture.périmètres.every(p => !chantier?.périmètreIds.includes(p));
    });

    if (['SERVICES_DECONCENTRES_DEPARTEMENT', 'SERVICES_DECONCENTRES_REGION'].includes(utilisateur.profil)) {
      return chantiersPasEnDoublonsAvecLesPérimètres.filter(chantierId => touslesChantiersTerritorialisésIds.has(chantierId));
    }

    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET'].includes(utilisateur.profil))
      return chantiersPasEnDoublonsAvecLesPérimètres.filter(chantierId => touslesChantiersIds.has(chantierId));

    return chantiersPasEnDoublonsAvecLesPérimètres;
  }

  private _déterminerChantiersAccessiblesEnSaisieIndicateur(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: ChantierSynthétisé[]): string[] {
    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM'].includes(utilisateur.profil))
      return this._déterminerChantiersAccessiblesEnLecture(utilisateur, chantiers);

    return [];
  }

  private _déterminerChantiersAccessiblesEnSaisieCommentaire(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: ChantierSynthétisé[]): string[] {
    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'SERVICES_DECONCENTRES_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT'].includes(utilisateur.profil)) {
      const chantiersIdsAccessiblesEnLecture = this._déterminerChantiersAccessiblesEnLecture(utilisateur, chantiers);

      if (['SERVICES_DECONCENTRES_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT'].includes(utilisateur.profil)) {
        return chantiers.filter(c => c.ate === 'hors_ate_deconcentre' && chantiersIdsAccessiblesEnLecture.includes(c.id)).map(c => c.id);
      }
      return chantiersIdsAccessiblesEnLecture;
    }
    
    return [];
  }

  private _déterminerTerritoiresAccessiblesEnLecture(utilisateur: UtilisateurÀCréerOuMettreÀJour, territoires: Territoire[]): string[] {
    if (utilisateur.profil === 'DROM') 
      return codesTerritoiresDROM;

    if (profilsRégionaux.includes(utilisateur.profil)) {
      const régionsSaisies = utilisateur.habilitations.lecture.territoires.filter(territoireCode => territoireCode.startsWith('REG'));
      const départementsEnfantsDesRégionsSaisies = régionsSaisies.flatMap(régionCode => territoires.filter(t => t.codeParent === régionCode).map(d => d.code));

      return [...régionsSaisies, ...départementsEnfantsDesRégionsSaisies];
    }

    if (profilsDépartementaux.includes(utilisateur.profil))
      return utilisateur.habilitations.lecture.territoires.filter(territoireCode => territoireCode.startsWith('DEPT'));

    return [];
  }

  private _déterminerTerritoiresAccessiblesEnSaisieCommentaire(utilisateur: UtilisateurÀCréerOuMettreÀJour, territoires: Territoire[]): string[] {
    if (['DITP_PILOTAGE', 'SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM'].includes(utilisateur.profil))
      return ['NAT-FR'];

    if (profilsRégionaux.includes(utilisateur.profil) || profilsDépartementaux.includes(utilisateur.profil))
      return this._déterminerTerritoiresAccessiblesEnLecture(utilisateur, territoires);
    
    return [];
  }

  private _déterminerPérimètresAccessiblesEnLecture(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    const tousLesPérimètresIds = new Set(périmètres.map(p => p.id));

    if (utilisateur.profil === 'DROM') 
      return ['PER-018'];
    
    if (['CABINET_MINISTERIEL', 'DIR_ADMIN_CENTRALE', 'SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'SERVICES_DECONCENTRES_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'DROM'].includes(utilisateur.profil))
      return utilisateur.habilitations.lecture.périmètres.filter(p => tousLesPérimètresIds.has(p));

    return [];
  }

  private _déterminerPérimètresAccessiblesEnSaisieIndicateur(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM'].includes(utilisateur.profil))
      return this._déterminerPérimètresAccessiblesEnLecture(utilisateur, périmètres);
    
    return [];
  }

  private _déterminerPérimètresAccessiblesEnSaisieCommentaire(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'SERVICES_DECONCENTRES_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'DROM'].includes(utilisateur.profil))
      return this._déterminerPérimètresAccessiblesEnLecture(utilisateur, périmètres);
      
    return [];
  }

  private async _définirLesHabilitations(utilisateur: UtilisateurÀCréerOuMettreÀJour): Promise<HabilitationsÀCréerOuMettreÀJourCalculées> {
    const chantiers = await this.chantierRepository.récupérerChantiersSynthétisés();
    const territoires = await this.territoireRepository.récupérerTous();
    const périmètres = await this.périmètreMinistérielRepository.récupérerTous();
      
    return {
      lecture: {
        chantiers: this._déterminerChantiersAccessiblesEnLecture(utilisateur, chantiers),
        territoires: this._déterminerTerritoiresAccessiblesEnLecture(utilisateur, territoires),
        périmètres: this._déterminerPérimètresAccessiblesEnLecture(utilisateur, périmètres),
      },
      'saisie.indicateur': {
        chantiers: this._déterminerChantiersAccessiblesEnSaisieIndicateur(utilisateur, chantiers),
        territoires: [],
        périmètres: this._déterminerPérimètresAccessiblesEnSaisieIndicateur(utilisateur, périmètres),
      },
      'saisie.commentaire': {
        chantiers: this._déterminerChantiersAccessiblesEnSaisieCommentaire(utilisateur, chantiers),
        territoires: this._déterminerTerritoiresAccessiblesEnSaisieCommentaire(utilisateur, territoires),
        périmètres: this._déterminerPérimètresAccessiblesEnSaisieCommentaire(utilisateur, périmètres),
      },
    };
  }

  private async _vérifierExistenceUtilisateur(email: string, utilisateurExistant: boolean) {
    const utilisateurExiste = await this.utilisateurRepository.récupérer(email);

    if (utilisateurExistant && !utilisateurExiste) 
      throw new Error('Le compte à modifier n’existe pas.');
    
    if (!utilisateurExistant && utilisateurExiste)
      throw new Error('Un compte a déjà été créé avec cette adresse électronique.');
  }

  async run(utilisateur: UtilisateurÀCréerOuMettreÀJour, auteurModification: string, utilisateurExistant: boolean, habilitations: Habilitations): Promise<void> {
    const habilitationsFormatées = await this._définirLesHabilitations(utilisateur);

    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(habilitationsFormatées.lecture.chantiers, habilitationsFormatées.lecture.territoires);

    await this._vérifierExistenceUtilisateur(utilisateur.email, utilisateurExistant);

    await this.utilisateurRepository.créerOuMettreÀJour({ ...utilisateur, habilitations: habilitationsFormatées }, auteurModification);

    if (process.env.IMPORT_KEYCLOAK_URL && !utilisateurExistant) {
      const utilisateursPourIAM = [{ nom: utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }];
      await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
    }
  }
}
