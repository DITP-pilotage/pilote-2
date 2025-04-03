import { Chantier } from '@/server/chantiers/domain/Chantier.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import {
  ChantierNonAutoriséErreur,
  ChantiersNonAutorisésCreationModificationUtilisateurErreur,
  ChantiersNonAutorisésSuppressionUtilisateurErreur,
  ProfilNonAutorisésSuppressionUtilisateurErreur,
  TerritoireNonAutoriséErreur,
  TerritoiresNonAutorisésCreationModificationUtilisateurErreur,
  TerritoiresNonAutorisésSuppressionUtilisateurErreur,
} from '@/server/utils/errors';
import { toutesLesValeursDuTableauSontContenuesDansLAutreTableau } from '@/client/utils/arrays';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { ProfilCode } from '@/server/gestion-utilisateur/domain/Utilisateur';
import { UnauthorizedError } from '@/server/app/error-boundary/unauthorized-error';
import {
  PropositionValeurAvancementChantierInformation,
} from '@/server/chantiers/domain/PropositionValeurAvancementChantierInformation';
import { MailleInterne } from '@/server/chantiers/domain/Maille';
import { Habilitations } from './Habilitation.interface';

const PROFIL_AUTORISE_A_MODIFICATION_TOKEN_API = new Set([ProfilEnum.DITP_ADMIN]);
const PROFIL_AUTORISE_A_LECTURE_METADATA_INDICATEUR = new Set([ProfilEnum.DITP_ADMIN]);
const PROFIL_AUTORISE_A_MODIFICATION_METADATA_INDICATEUR = new Set([ProfilEnum.DITP_ADMIN]);
const PROFIL_AUTORISE_A_MODIFICATION_GESTION_CONTENU = new Set([ProfilEnum.DITP_ADMIN]);
const PROFIL_AUTORISE_A_MODIFICATION_PROPOSITION_VALEUR_AVANCEMENT = new Set([
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.PREFET_DEPARTEMENT,
  ProfilEnum.PREFET_REGION,
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
]);

export class Habilitation {
  constructor(private _habilitations: Habilitations) {}

  vérifierLesHabilitationsEnLecture(chantierId: Chantier['id'], territoireCode: string | null): Error | void {
    if (!this._habilitations.lecture.chantiers.includes(chantierId))
      throw new ChantierNonAutoriséErreur();

    if (territoireCode && !this._habilitations.lecture.territoires.includes(territoireCode))
      throw new TerritoireNonAutoriséErreur();
  }

  vérifierLesHabilitationsEnSaisieDesPublications(chantierId: Chantier['id'], territoireCode: string): Error | void {
    if (!this._habilitations['saisieCommentaire'].chantiers.includes(chantierId))
      throw new ChantierNonAutoriséErreur();

    if (!this._habilitations['saisieCommentaire'].territoires.includes(territoireCode))
      throw new TerritoireNonAutoriséErreur();
  }

  vérifierLesHabilitationsEnCréationModificationUtilisateur(chantiersIds: Chantier['id'][], territoiresCodes: Territoire['code'][], profil: Profil | null) {
    if (!profil || !profil.utilisateurs.modificationPossible) {
      throw new ProfilNonAutorisésSuppressionUtilisateurErreur();
    }
    if (profil.utilisateurs.tousChantiers && !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(territoiresCodes, this._habilitations.gestionUtilisateur.territoires)) {
      throw new TerritoiresNonAutorisésCreationModificationUtilisateurErreur();
    }
    if (profil.utilisateurs.tousTerritoires && !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(chantiersIds, this._habilitations.gestionUtilisateur.chantiers))
      throw new ChantiersNonAutorisésCreationModificationUtilisateurErreur();
  }
  
  vérifierLesHabilitationsEnSuppressionUtilisateur(chantiersIds: Chantier['id'][], territoiresCodes: Territoire['code'][], profil: Profil | null) {
    if (!profil || !profil.utilisateurs.modificationPossible) {
      throw new ProfilNonAutorisésSuppressionUtilisateurErreur();
    }

    if (profil.utilisateurs.tousChantiers && !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(territoiresCodes, this._habilitations.gestionUtilisateur.territoires)) {
      throw new TerritoiresNonAutorisésSuppressionUtilisateurErreur();
    }

    if (profil.utilisateurs.tousTerritoires && !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(chantiersIds, this._habilitations.gestionUtilisateur.chantiers)) 
      throw new ChantiersNonAutorisésSuppressionUtilisateurErreur();
  }

  verifierAutorisationModificationTokenAPI(profil: ProfilCode | null) {
    if (!profil || !PROFIL_AUTORISE_A_MODIFICATION_TOKEN_API.has(profil)) {
      throw new UnauthorizedError("Vous n'êtes pas autorisé a effectuer cette action");
    }
  }

  verifierAutorisationLectureMetadataIndicateur(profil: ProfilCode | null) {
    if (!profil || !PROFIL_AUTORISE_A_LECTURE_METADATA_INDICATEUR.has(profil)) {
      throw new UnauthorizedError("Vous n'êtes pas autorisé a effectuer cette action");
    }
  }

  verifierAutorisationModificationMetadataIndicateur(profil: ProfilCode | null) {
    if (!profil || !PROFIL_AUTORISE_A_MODIFICATION_METADATA_INDICATEUR.has(profil)) {
      throw new UnauthorizedError("Vous n'êtes pas autorisé a effectuer cette action");
    }
  }

  verifierAutorisationModificationGestionContenu(profil: ProfilCode | null) {
    if (!profil || !PROFIL_AUTORISE_A_MODIFICATION_GESTION_CONTENU.has(profil)) {
      throw new UnauthorizedError("Vous n'êtes pas autorisé a effectuer cette action");
    }
  }

  verifierAutorisationModificationPropositionValeurAvancement(profil: ProfilCode | null, chantiersIdsAutorisés: string[], propositionValeurAvancementChantierInformation: PropositionValeurAvancementChantierInformation) {
    if (!profil || !PROFIL_AUTORISE_A_MODIFICATION_PROPOSITION_VALEUR_AVANCEMENT.has(profil) || propositionValeurAvancementChantierInformation.statut === 'ARCHIVE' || !chantiersIdsAutorisés.includes(propositionValeurAvancementChantierInformation.id)) {
      throw new UnauthorizedError("Vous n'êtes pas autorisé a effectuer cette action");
    }
  }

  possedeAuMoinsUnTerritoireEnGestionUtilisateur() {
    return this._habilitations.gestionUtilisateur.territoires.length > 0;
  }

  possedeAuMoinsUnChantierEnGestionUtilisateur() {
    return this._habilitations.gestionUtilisateur.chantiers.length > 0;
  }

  peutCréerEtModifierUnUtilisateur() {
    return this.possedeAuMoinsUnTerritoireEnGestionUtilisateur() && this.possedeAuMoinsUnChantierEnGestionUtilisateur();
  }

  peutConsulterLaListeDesUtilisateurs() {
    return this.possedeAuMoinsUnTerritoireEnGestionUtilisateur() && this.possedeAuMoinsUnChantierEnGestionUtilisateur();
  }

  peutAccéderAuTerritoireUtilisateurs(territoireCode: string): boolean {
    return this._habilitations.gestionUtilisateur.territoires.includes(territoireCode);
  }

  peutAccéderAuxTerritoiresUtilisateurs(territoiresCodes: string[]): boolean {
    for (const territoiresCode of territoiresCodes) {
      if (!this.peutAccéderAuTerritoireUtilisateurs(territoiresCode)) {
        return false;
      }
    }
    return true;
  }

  peutAccéderAuTerritoire(territoireCode: string): boolean {
    return this._habilitations.lecture.territoires.includes(territoireCode);
  }

  peutAccéderAuxTerritoires(territoiresCodes: string[]): boolean {
    for (const territoiresCode of territoiresCodes) {
      if (!this.peutAccéderAuTerritoire(territoiresCode)) {
        return false;
      }
    }
    return true;
  }

  peutSaisirDesPublicationsPourUnTerritoire(territoireCode: string): boolean {
    return this._habilitations['saisieCommentaire'].territoires.includes(territoireCode);
  }

  peutSaisirDesIndicateursPourUnTerritoire(territoireCode: string): boolean {
    return this._habilitations['saisieIndicateur'].territoires.includes(territoireCode);
  }

  récupérerListeChantiersIdsAccessiblesEnLecture(): Chantier['id'][] {
    return [...this._habilitations.lecture.chantiers];
  }

  récupérerListeTerritoireCodesAccessiblesEnLecture(): string[] {
    return [...this._habilitations.lecture.territoires];
  }

  recupererListeMailleEnLectureDisponible(): MailleInterne[] {
    const territoires = this.récupérerListeTerritoireCodesAccessiblesEnLecture();
    let result: MailleInterne[] = [];

    for (const codeTerritoire of territoires) {
      if (codeTerritoire.startsWith('REG') && !result.includes('regionale')) {
        result.push('regionale');
      } else if (codeTerritoire.startsWith('DEPT') && !result.includes('departementale')) {
        result.push('departementale');
      }
    }
    return result;
  }
}
