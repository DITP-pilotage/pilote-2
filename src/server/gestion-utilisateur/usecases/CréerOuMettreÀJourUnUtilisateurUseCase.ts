import Utilisateur, {
  profilsDépartementaux,
  profilsInfolettreCoordinateur,
  profilsRégionaux,
  UtilisateurÀCréerOuMettreÀJour,
} from '@/server/domain/utilisateur/Utilisateur.interface';
import {
  Habilitations,
  HabilitationsÀCréerOuMettreÀJourCalculées,
} from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { codesTerritoiresDROM } from '@/validation/utilisateur';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';
import { HistorisationModification } from '@/server/domain/historisationModification/HistorisationModification';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { ContactInfoLettresService } from '@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService';
import { PerimetreMinisterielRepository } from '@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository';
import { TerritoireRepository } from '@/server/gestion-utilisateur/domain/ports/TerritoireRepository';
import { ChantierRepository } from '@/server/gestion-utilisateur/domain/ports/ChantierRepository';
import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';
import { InformationChantierUtilisateur } from '@/server/gestion-utilisateur/domain/InformationChantierUtilisateur';
import { UtilisateurIAMRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository';

type Dependencies = {
  utilisateurIAMRepository: UtilisateurIAMRepository,
  utilisateurRepository: UtilisateurRepository,
  territoireRepository: TerritoireRepository,
  chantierRepository: ChantierRepository,
  perimetreMinisterielRepository: PerimetreMinisterielRepository,
  historisationModification: HistorisationModificationRepository,
  contactInfoLettresService: ContactInfoLettresService,
};

export default class CréerOuMettreÀJourUnUtilisateurUseCase {
  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private utilisateurRepository: UtilisateurRepository;

  private territoireRepository: TerritoireRepository;

  private chantierRepository: ChantierRepository;

  private perimetreMinisterielRepository: PerimetreMinisterielRepository;

  private historisationModification: HistorisationModificationRepository;

  private contactInfoLettresService: ContactInfoLettresService;

  constructor({
    utilisateurIAMRepository,
    utilisateurRepository,
    territoireRepository,
    chantierRepository,
    perimetreMinisterielRepository,
    historisationModification,
    contactInfoLettresService,
  }: Dependencies) {
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.territoireRepository = territoireRepository;
    this.chantierRepository = chantierRepository;
    this.perimetreMinisterielRepository = perimetreMinisterielRepository;
    this.historisationModification = historisationModification;
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async run(utilisateur: UtilisateurÀCréerOuMettreÀJour, auteur: string, auteurId: string, utilisateurExistant: boolean, habilitations: Habilitations, profil: Profil | null): Promise<void> {
    const listeInformationsChantiersUtilisateurs = await this.chantierRepository.listerInformationsChantiersUtilisateurs();
    const listeTerritoiresCodes = await this.territoireRepository.listerCodes([]);
    const listePerimetresMinisteriels = await this.perimetreMinisterielRepository.listerIds([]);
    
    const habilitationsFormatées = await this._définirLesHabilitations(utilisateur, listeInformationsChantiersUtilisateurs);
    let utilisateurAvantModification: Utilisateur | null = null;

    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(habilitationsFormatées.lecture.chantiers, habilitationsFormatées.lecture.territoires, profil);

    await this._vérifierExistenceUtilisateur(utilisateur.email, utilisateurExistant);

    if (utilisateurExistant) {
      utilisateurAvantModification = await this.utilisateurRepository.récupérer(
        utilisateur.email, 
        listeTerritoiresCodes,
        listePerimetresMinisteriels,
        listeInformationsChantiersUtilisateurs,
      ) as Utilisateur;
    }

    await this.utilisateurRepository.créerOuMettreÀJour({ ...utilisateur, habilitations: habilitationsFormatées }, auteurId);

    const utilisateurApresExecution = await this.utilisateurRepository.récupérer(
      utilisateur.email,
      listeTerritoiresCodes,
      listePerimetresMinisteriels,
      listeInformationsChantiersUtilisateurs,      
    ) as Utilisateur;

    const historisationModification = utilisateurExistant ? HistorisationModification.creerHistorisationModification({
      utilisateurNom: auteur,
      tableModifieId: 'utilisateur',
      ancienneValeur: utilisateurAvantModification as Utilisateur,
      nouvelleValeur: utilisateurApresExecution,
    }) : HistorisationModification.creerHistorisationCreation({
      utilisateurNom: auteur,
      tableModifieId: 'utilisateur',
      nouvelleValeur: utilisateurApresExecution,
    });

    await this.historisationModification.sauvegarderModificationHistorisation(historisationModification);

    if (process.env.NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO === 'true' && !utilisateurExistant) {
      const listesDiffusion = profilsInfolettreCoordinateur.includes(utilisateur.profil) ? [3] : [];
      await this.contactInfoLettresService.creerContact(utilisateur.email, utilisateur.nom, utilisateur.prénom, listesDiffusion);
    }

    if (process.env.IMPORT_KEYCLOAK_URL && !utilisateurExistant) {
      const utilisateursPourIAM = [{ nom: utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }];
      await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
    }
  }

  private _déterminerChantiersPasEnDoublonsAvecLesPérimètres(chantiersSélectionnés: string[], périmètreSélectionnés: string[], chantiers: InformationChantierUtilisateur[]): string[] {
    return chantiersSélectionnés.filter(chantierId => {
      const chantier = chantiers.find(c => c.id === chantierId);
      return périmètreSélectionnés.every(p => !chantier?.perimetreIds.includes(p));
    });
  }

  private _déterminerChantiersAccessiblesEnLecture(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: InformationChantierUtilisateur[]): string[] {
    const touslesChantiersIds = new Set(chantiers.map(chantier => chantier.id));
    const touslesChantiersTerritorialisésIds = new Set(chantiers.filter(chantier => chantier.estTerritorialise).map(chantier => chantier.id));

    const chantiersPasEnDoublonsAvecLesPérimètres = this._déterminerChantiersPasEnDoublonsAvecLesPérimètres(
      utilisateur.habilitations.lecture.chantiers,
      utilisateur.habilitations.lecture.périmètres,
      chantiers,
    );

    if ([ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT, ProfilEnum.SERVICES_DECONCENTRES_REGION].includes(utilisateur.profil)) {
      return chantiersPasEnDoublonsAvecLesPérimètres.filter(chantierId => touslesChantiersTerritorialisésIds.has(chantierId));
    }

    if ([ProfilEnum.SECRETARIAT_GENERAL, ProfilEnum.EQUIPE_DIR_PROJET, ProfilEnum.DIR_PROJET].includes(utilisateur.profil))
      return chantiersPasEnDoublonsAvecLesPérimètres.filter(chantierId => touslesChantiersIds.has(chantierId));

    return chantiersPasEnDoublonsAvecLesPérimètres;
  }

  private _déterminerChantiersResponsabilite(utilisateur: UtilisateurÀCréerOuMettreÀJour): string[] {
    return utilisateur.habilitations.responsabilite.chantiers;
  }

  private _déterminerChantiersAccessiblesEnSaisieIndicateur(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: InformationChantierUtilisateur[]): string[] {
    if (utilisateur.saisieIndicateur) {
      return this._déterminerChantiersAccessiblesEnLecture(utilisateur, chantiers);
    }

    return [];
  }

  private _déterminerChantiersAccessiblesEnSaisieCommentaire(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: InformationChantierUtilisateur[]): string[] {
    if (utilisateur.saisieCommentaire) {
      const chantiersIdsAccessiblesEnLecture = this._déterminerChantiersAccessiblesEnLecture(utilisateur, chantiers);

      if ([ProfilEnum.SERVICES_DECONCENTRES_REGION, ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT].includes(utilisateur.profil)) {
        return chantiers.filter(c => c.ate !== 'hors_ate_centralise' && chantiersIdsAccessiblesEnLecture.includes(c.id)).map(c => c.id);
      }

      return chantiersIdsAccessiblesEnLecture;
    }
    
    return [];
  }

  private _déterminerChantierAccessiblesEnGestionUtilisateur(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: InformationChantierUtilisateur[]): string[] {
    if (utilisateur.gestionUtilisateur) {
      return this._déterminerChantiersAccessiblesEnLecture(utilisateur, chantiers);
    }
    
    return [];
  }

  private _déterminerTerritoiresAccessiblesEnLecture(utilisateur: UtilisateurÀCréerOuMettreÀJour, territoires: Territoire[]): string[] {
    if (utilisateur.profil === ProfilEnum.DROM)
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

  private _déterminerTerritoiresResponsabilite(utilisateur: UtilisateurÀCréerOuMettreÀJour, territoires: Territoire[], chantiersResponsabilite: string[]): string[] {
    return chantiersResponsabilite.length > 0 ? this._déterminerTerritoiresAccessiblesEnLecture(utilisateur, territoires) : [];
  }

  private _déterminerTerritoiresAccessiblesEnSaisieCommentaire(utilisateur: UtilisateurÀCréerOuMettreÀJour, territoires: Territoire[]): string[] {
    if (utilisateur.saisieCommentaire) {
      if ([ProfilEnum.DITP_PILOTAGE, ProfilEnum.DROM].includes(utilisateur.profil))
        return ['NAT-FR'];

      return this._déterminerTerritoiresAccessiblesEnLecture(utilisateur, territoires);

    }
    
    return [];
  }

  private _déterminerTerritoiresAccessiblesEnGestionUtilisateur(utilisateur: UtilisateurÀCréerOuMettreÀJour, territoires: Territoire[]): string[] {
    if (utilisateur.gestionUtilisateur) {
      return utilisateur.profil === 'SECRETARIAT_GENERAL' 
        ? territoires.filter(territoire => territoire.code !== 'NAT-FR').map(territoire => territoire.code)
        : this._déterminerTerritoiresAccessiblesEnLecture(utilisateur, territoires);
    }
    
    return [];    
  }

  private _déterminerPérimètresAccessiblesEnLecture(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    const tousLesPérimètresIds = new Set(périmètres.map(p => p.id));

    if (utilisateur.profil === ProfilEnum.DROM)
      return ['PER-018'];
    
    if ([ProfilEnum.CABINET_MINISTERIEL, ProfilEnum.DIR_ADMIN_CENTRALE, ProfilEnum.SECRETARIAT_GENERAL, ProfilEnum.EQUIPE_DIR_PROJET, ProfilEnum.DIR_PROJET, ProfilEnum.SERVICES_DECONCENTRES_REGION, ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT, ProfilEnum.DROM].includes(utilisateur.profil))
      return utilisateur.habilitations.lecture.périmètres.filter(p => tousLesPérimètresIds.has(p));

    return [];
  }

  private _déterminerPérimètresAccessiblesEnSaisieIndicateur(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    if (utilisateur.saisieIndicateur)
      return this._déterminerPérimètresAccessiblesEnLecture(utilisateur, périmètres);

    return [];
  }

  private _déterminerPérimètresAccessiblesEnSaisieCommentaire(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    if (utilisateur.saisieCommentaire)
      return this._déterminerPérimètresAccessiblesEnLecture(utilisateur, périmètres);

    return [];
  }

  private _déterminerPérimètresAccessiblesEnGestionUtilisateur(utilisateur: UtilisateurÀCréerOuMettreÀJour, périmètres: PérimètreMinistériel[]): string[] {
    if (utilisateur.gestionUtilisateur)
      return this._déterminerPérimètresAccessiblesEnLecture(utilisateur, périmètres);

    return [];
  }

  private async _définirLesHabilitations(utilisateur: UtilisateurÀCréerOuMettreÀJour, chantiers: InformationChantierUtilisateur[]): Promise<HabilitationsÀCréerOuMettreÀJourCalculées> {
    const territoires = await this.territoireRepository.lister([]);
    const périmètres = await this.perimetreMinisterielRepository.lister([]);

    const chantiersResponsabilite = this._déterminerChantiersResponsabilite(utilisateur);
      
    return {
      lecture: {
        chantiers: this._déterminerChantiersAccessiblesEnLecture(utilisateur, chantiers),
        territoires: this._déterminerTerritoiresAccessiblesEnLecture(utilisateur, territoires),
        périmètres: this._déterminerPérimètresAccessiblesEnLecture(utilisateur, périmètres),
      },
      saisieIndicateur: {
        chantiers: this._déterminerChantiersAccessiblesEnSaisieIndicateur(utilisateur, chantiers),
        territoires: [],
        périmètres: this._déterminerPérimètresAccessiblesEnSaisieIndicateur(utilisateur, périmètres),
      },
      saisieCommentaire: {
        chantiers: this._déterminerChantiersAccessiblesEnSaisieCommentaire(utilisateur, chantiers),
        territoires: this._déterminerTerritoiresAccessiblesEnSaisieCommentaire(utilisateur, territoires),
        périmètres: this._déterminerPérimètresAccessiblesEnSaisieCommentaire(utilisateur, périmètres),
      },
      gestionUtilisateur: {
        chantiers: this._déterminerChantierAccessiblesEnGestionUtilisateur(utilisateur, chantiers),
        territoires: this._déterminerTerritoiresAccessiblesEnGestionUtilisateur(utilisateur, territoires),
        périmètres: this._déterminerPérimètresAccessiblesEnGestionUtilisateur(utilisateur, périmètres),
      },
      responsabilite: {
        chantiers: chantiersResponsabilite,
        territoires: this._déterminerTerritoiresResponsabilite(utilisateur, territoires, chantiersResponsabilite),
        périmètres: [],
      },
    };
  }

  private async _vérifierExistenceUtilisateur(email: string, utilisateurExistant: boolean) {
    const utilisateurExiste = await this.utilisateurRepository.verifierExistenceUtilisateur(email);

    if (utilisateurExistant && !utilisateurExiste)  {
      throw new Error("Le compte à modifier n'existe pas.");
    }

    if (!utilisateurExistant && utilisateurExiste) {
      throw new Error('Un compte a déjà été créé avec cette adresse électronique.');
    }
  }
}
