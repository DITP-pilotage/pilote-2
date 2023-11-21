import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import Utilisateur, {
  profilsDépartementaux,
  profilsRégionaux,
  profilsTerritoriaux,
  UtilisateurÀCréerOuMettreÀJour,
} from '@/server/domain/utilisateur/Utilisateur.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import {
  Habilitations,
  HabilitationsÀCréerOuMettreÀJourCalculées,
} from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { codesTerritoiresDROM } from '@/validation/utilisateur';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PérimètreMinistérielRepository
  from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';
import { HistorisationModification } from '@/server/domain/historisationModification/HistorisationModification';

export default class CréerOuMettreÀJourUnUtilisateurUseCase {
  constructor(
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository = dependencies.getUtilisateurIAMRepository(),
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
    private readonly périmètreMinistérielRepository: PérimètreMinistérielRepository = dependencies.getPérimètreMinistérielRepository(),
    private readonly historisationModification: HistorisationModificationRepository = dependencies.getHistorisationModificationRepository(),
  ) {}

  async run(utilisateur: UtilisateurÀCréerOuMettreÀJour, auteurModification: string, utilisateurExistant: boolean, habilitations: Habilitations): Promise<void> {
    const habilitationsFormatées = await this._définirLesHabilitations(utilisateur);
    let utilisateurAvantModification: Utilisateur | null = null;

    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(habilitationsFormatées.lecture.chantiers, habilitationsFormatées.lecture.territoires);

    await this._vérifierExistenceUtilisateur(utilisateur.email, utilisateurExistant);

    if (utilisateurExistant) {
      utilisateurAvantModification = await this.utilisateurRepository.récupérer(utilisateur.email) as Utilisateur;
    }

    await this.utilisateurRepository.créerOuMettreÀJour({ ...utilisateur, habilitations: habilitationsFormatées }, auteurModification);

    const utilisateurApresExecution = await this.utilisateurRepository.récupérer(utilisateur.email) as Utilisateur;

    const historisationModification = utilisateurExistant ? HistorisationModification.creerHistorisationModification({
      utilisateurNom: auteurModification,
      tableModifieId: 'utilisateur',
      ancienneValeur: utilisateurAvantModification as Utilisateur,
      nouvelleValeur: utilisateurApresExecution,
    }) : HistorisationModification.creerHistorisationCreation({
      utilisateurNom: auteurModification,
      tableModifieId: 'utilisateur',
      nouvelleValeur: utilisateurApresExecution,
    });

    await this.historisationModification.sauvegarderModificationHistorisation(historisationModification);

    if (process.env.IMPORT_KEYCLOAK_URL && !utilisateurExistant) {
      const utilisateursPourIAM = [{ nom: utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }];
      await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
    }
  }

  private _déterminerChantiersPasEnDoublonsAvecLesPérimètres(chantiersSélectionnés: string[], périmètreSélectionnés: string[], chantiers: ChantierSynthétisé[]): string[] {
    return chantiersSélectionnés.filter(chantierId => {
      const chantier = chantiers.find(c => c.id === chantierId);
      return périmètreSélectionnés.every(p => !chantier?.périmètreIds.includes(p));
    });
  }

  private _déterminerChantiersAccessiblesEnLecture(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: ChantierSynthétisé[]): string[] {
    const touslesChantiersIds = new Set(chantiers.map(chantier => chantier.id));
    const touslesChantiersTerritorialisésIds = new Set(chantiers.filter(chantier => chantier.estTerritorialisé).map(chantier => chantier.id));

    const chantiersPasEnDoublonsAvecLesPérimètres = this._déterminerChantiersPasEnDoublonsAvecLesPérimètres(
      utilisateur.habilitations.lecture.chantiers,
      utilisateur.habilitations.lecture.périmètres,
      chantiers,
    );

    if (['SERVICES_DECONCENTRES_DEPARTEMENT', 'SERVICES_DECONCENTRES_REGION', 'RESPONSABLE_REGION', 'RESPONSABLE_DEPARTEMENT'].includes(utilisateur.profil)) {
      return chantiersPasEnDoublonsAvecLesPérimètres.filter(chantierId => touslesChantiersTerritorialisésIds.has(chantierId));
    }

    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET'].includes(utilisateur.profil))
      return chantiersPasEnDoublonsAvecLesPérimètres.filter(chantierId => touslesChantiersIds.has(chantierId));

    return chantiersPasEnDoublonsAvecLesPérimètres;
  }

  private _déterminerChantiersAccessiblesEnSaisieIndicateur(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: ChantierSynthétisé[]): string[] {
    const touslesChantiersIds = new Set(chantiers.map(chantier => chantier.id));

    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM'].includes(utilisateur.profil)) {
      const chantiersPasEnDoublonsAvecLesPérimètres = this._déterminerChantiersPasEnDoublonsAvecLesPérimètres(
        utilisateur.habilitations.saisieIndicateur.chantiers,
        utilisateur.habilitations.saisieIndicateur.périmètres,
        chantiers,
      );
      return chantiersPasEnDoublonsAvecLesPérimètres.filter(chantierId => touslesChantiersIds.has(chantierId));
    }

    return [];
  }

  private _déterminerChantiersAccessiblesEnSaisieCommentaire(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: ChantierSynthétisé[]): string[] {
    const touslesChantiersIds = new Set(chantiers.map(chantier => chantier.id));
    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET'].includes(utilisateur.profil) || profilsTerritoriaux.includes(utilisateur.profil)) {
      const chantiersPasEnDoublonsAvecLesPérimètres = this._déterminerChantiersPasEnDoublonsAvecLesPérimètres(
        utilisateur.habilitations.saisieCommentaire.chantiers,
        utilisateur.habilitations.saisieCommentaire.périmètres,
        chantiers,
      );
      return chantiersPasEnDoublonsAvecLesPérimètres.filter(chantierId => touslesChantiersIds.has(chantierId));
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
    if (['DITP_PILOTAGE', 'DROM'].includes(utilisateur.profil))
      return ['NAT-FR'];

    if (profilsRégionaux.includes(utilisateur.profil) || profilsDépartementaux.includes(utilisateur.profil))
      return this._déterminerTerritoiresAccessiblesEnLecture(utilisateur, territoires);
    
    return [];
  }

  private _déterminerPérimètresAccessiblesEnLecture(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    const tousLesPérimètresIds = new Set(périmètres.map(p => p.id));

    if (utilisateur.profil === 'DROM') 
      return ['PER-018'];
    
    if (['CABINET_MINISTERIEL', 'DIR_ADMIN_CENTRALE', 'SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'SERVICES_DECONCENTRES_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'DROM', 'RESPONSABLE_REGION', 'RESPONSABLE_DEPARTEMENT'].includes(utilisateur.profil))
      return utilisateur.habilitations.lecture.périmètres.filter(p => tousLesPérimètresIds.has(p));

    return [];
  }

  private _déterminerPérimètresAccessiblesEnSaisieIndicateur(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    const tousLesPérimètresIds = new Set(périmètres.map(p => p.id));

    // if (utilisateur.profil === 'DROM') 
    //   return ['PER-018'];
    
    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM'].includes(utilisateur.profil))
      return utilisateur.habilitations.saisieIndicateur.périmètres.filter(p => tousLesPérimètresIds.has(p));
    
    return [];
  }

  private _déterminerPérimètresAccessiblesEnSaisieCommentaire(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    const tousLesPérimètresIds = new Set(périmètres.map(p => p.id));
    // if (utilisateur.profil === 'DROM') 
    //   return ['PER-018'];
    
    if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET'].includes(utilisateur.profil) || profilsTerritoriaux.includes(utilisateur.profil))
      return utilisateur.habilitations.saisieCommentaire.périmètres.filter(p => tousLesPérimètresIds.has(p));

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
      'saisieIndicateur': {
        chantiers: this._déterminerChantiersAccessiblesEnSaisieIndicateur(utilisateur, chantiers),
        territoires: [],
        périmètres: this._déterminerPérimètresAccessiblesEnSaisieIndicateur(utilisateur, périmètres),
      },
      'saisieCommentaire': {
        chantiers: this._déterminerChantiersAccessiblesEnSaisieCommentaire(utilisateur, chantiers),
        territoires: this._déterminerTerritoiresAccessiblesEnSaisieCommentaire(utilisateur, territoires),
        périmètres: this._déterminerPérimètresAccessiblesEnSaisieCommentaire(utilisateur, périmètres),
      },
    };
  }

  private async _vérifierExistenceUtilisateur(email: string, utilisateurExistant: boolean) {
    const utilisateurExiste = await this.utilisateurRepository.récupérer(email);

    if (utilisateurExistant && !utilisateurExiste)  {
      throw new Error('Le compte à modifier n’existe pas.');
    }

    if (!utilisateurExistant && utilisateurExiste) {
      throw new Error('Un compte a déjà été créé avec cette adresse électronique.');
    }
  }
}
