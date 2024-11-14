import Chantier from '@/server/domain/chantier/Chantier.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import {
  ChantierNonAutoriséErreur,
  ChantiersNonAutorisésCreationModificationUtilisateurErreur,
  ChantiersNonAutorisésSuppressionUtilisateurErreur,
  ProfilNonAutorisésSuppressionUtilisateurErreur,
  ProjetStructurantNonAutoriséErreur,
  TerritoireNonAutoriséErreur,
  TerritoiresNonAutorisésCreationModificationUtilisateurErreur,
  TerritoiresNonAutorisésSuppressionUtilisateurErreur,
} from '@/server/utils/errors';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { toutesLesValeursDuTableauSontContenuesDansLAutreTableau } from '@/client/utils/arrays';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { Habilitations } from './Habilitation.interface';

export default class Habilitation {
  constructor(private _habilitations: Habilitations) {}
  
  vérifierLesHabilitationsEnLecture(chantierId: Chantier['id'], territoireCode: string | null): Error | void {
    if (!this._habilitations.lecture.chantiers.includes(chantierId))
      throw new ChantierNonAutoriséErreur();

    if (territoireCode && !this._habilitations.lecture.territoires.includes(territoireCode))
      throw new TerritoireNonAutoriséErreur();
  }

  vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId: ProjetStructurant['id']): Error | void {
    if (!this._habilitations['projetsStructurants.lecture'].projetsStructurants.includes(projetStructurantId))
      throw new ProjetStructurantNonAutoriséErreur();
  }

  vérifierLesHabilitationsEnSaisieDesPublications(chantierId: Chantier['id'], territoireCode: string): Error | void {
    if (!this._habilitations['saisieCommentaire'].chantiers.includes(chantierId))
      throw new ChantierNonAutoriséErreur();

    if (!this._habilitations['saisieCommentaire'].territoires.includes(territoireCode))
      throw new TerritoireNonAutoriséErreur();
  }

  vérifierLesHabilitationsEnSaisieDesPublicationsProjetsStructurants(territoireCode: string): Error | void {
    // Vérifications des habilitations à compléter
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

  récupérerListeProjetsStructurantsIdsAccessiblesEnLecture(): ProjetStructurant['id'][] {
    return [...this._habilitations['projetsStructurants.lecture'].projetsStructurants];
  }

  récupérerListeTerritoireCodesAccessiblesEnLecture(): string[] {
    return [...this._habilitations.lecture.territoires];
  }

  recupererListeMailleEnLectureDisponible(): MailleInterne[] {
    const territoires = this.récupérerListeTerritoireCodesAccessiblesEnLecture();
    let result: MailleInterne[] = [];

    for (const codeTerritoire of territoires) {
      if (codeTerritoire.startsWith('REG') && !result.includes('régionale')) {
        result.push('régionale');
      } else if (codeTerritoire.startsWith('DEPT') && !result.includes('départementale')) {
        result.push('départementale');
      }
    }
    return result;
  }
}
