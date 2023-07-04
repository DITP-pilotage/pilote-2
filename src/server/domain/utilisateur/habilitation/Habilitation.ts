import Chantier from '@/server/domain/chantier/Chantier.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { CodeInsee, Territoire } from '@/server/domain/territoire/Territoire.interface';
import { ChantierNonAutoriséErreur, ChantiersNonAutorisésCreationModificationUtilisateurErreur, ProjetStructurantNonAutoriséErreur, TerritoireNonAutoriséErreur, TerritoiresNonAutorisésCreationModificationUtilisateurErreur } from '@/server/utils/errors';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { toutesLesValeursDuTableauSontContenuesDansLAutreTableau } from '@/client/utils/arrays';
import { Habilitations, TerritoiresFiltre } from './Habilitation.interface';

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
    if (!this._habilitations['saisie.commentaire'].chantiers.includes(chantierId))
      throw new ChantierNonAutoriséErreur();

    if (!this._habilitations['saisie.commentaire'].territoires.includes(territoireCode))
      throw new TerritoireNonAutoriséErreur();
  }

  vérifierLesHabilitationsEnCréationModificationUtilisateur(chantiersIds: Chantier['id'][], territoiresCodes: Territoire['code'][]) {
    if (!toutesLesValeursDuTableauSontContenuesDansLAutreTableau(chantiersIds, this._habilitations['utilisateurs.modification'].chantiers))
      throw new ChantiersNonAutorisésCreationModificationUtilisateurErreur();

    if (!toutesLesValeursDuTableauSontContenuesDansLAutreTableau(territoiresCodes, this._habilitations['utilisateurs.modification'].territoires))
      throw new TerritoiresNonAutorisésCreationModificationUtilisateurErreur();
  }

  peutCréerEtModifierUnUtilisateur() {
    return this._habilitations['utilisateurs.modification'].chantiers.length > 0 || this._habilitations['utilisateurs.modification'].territoires.length > 0;
  }

  peutConsulterLaListeDesUtilisateurs() {
    return this._habilitations['utilisateurs.lecture'].chantiers.length > 0;
  }

  peutConsulterUnUtilisateur(chantiersIds: Chantier['id'][], territoireCodes: Territoire['code'][]) {
    return (chantiersIds.some(id => this._habilitations['utilisateurs.lecture'].chantiers.includes(id))
    && territoireCodes.some(code => this._habilitations['utilisateurs.lecture'].territoires.includes(code)));
  }

  peutAccéderAuProjetStructurant(projetStructurantId: ProjetStructurant['id']): boolean {
    return this._habilitations['projetsStructurants.lecture'].projetsStructurants.includes(projetStructurantId);
  }

  peutAccéderAuChantier(chantierId: Chantier['id'], territoireCode: string): boolean {
    return this._habilitations.lecture.chantiers.includes(chantierId) && this._habilitations.lecture.territoires.includes(territoireCode) ? true : false;
  }

  peutModifierLeChantier(chantierId: Chantier['id'], territoireCode: string): boolean {
    return this._habilitations['saisie.commentaire'].chantiers.includes(chantierId) && this._habilitations['saisie.commentaire'].territoires.includes(territoireCode) ? true : false;
  }

  peutSaisirLesIndicateursDuChantier(chantierId: Chantier['id'], territoireCode: string): boolean {
    return this._habilitations['saisie.indicateur'].chantiers.includes(chantierId) && this._habilitations['saisie.indicateur'].territoires.includes(territoireCode) ? true : false;
  }

  peutAccéderAuTerritoire(territoireCode: string): boolean {
    return this._habilitations.lecture.territoires.includes(territoireCode) ? true : false;
  }

  peutSaisirDesPublicationsPourUnTerritoire(territoireCode: string): boolean {
    return this._habilitations['saisie.commentaire'].territoires.includes(territoireCode) ? true : false;
  }

  peutSaisirDesIndicateursPourUnTerritoire(territoireCode: string): boolean {
    return this._habilitations['saisie.indicateur'].territoires.includes(territoireCode) ? true : false;
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

  récupérerMailleEtCodeEnLecture() : TerritoiresFiltre {
    const territoires = this.récupérerListeTerritoireCodesAccessiblesEnLecture();
    const result = {
      REG: { maille: 'régionale', territoires: [] as string[] },
      DEPT: { maille: 'départementale', territoires: [] as string[] },
      NAT: { maille: 'nationale', territoires: [] as string[] },
    };

    for (const codeTerritoire of territoires) {
      if (codeTerritoire.startsWith('REG')) {
        result.REG.territoires.push(codeTerritoire);
      } else if (codeTerritoire.startsWith('DEPT')) {
        result.DEPT.territoires.push(codeTerritoire);
      } else if (codeTerritoire.startsWith('NAT')) {
        result.NAT.territoires.push(codeTerritoire);
      }
    }
    return result;
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

  recupererListeCodeInseeEnLectureDisponible(maille: string) : CodeInsee[] {
    let result = [];
    const territoires = this.récupérerListeTerritoireCodesAccessiblesEnLecture();
    const codeMaille = (maille == 'régionale') ? 'REG' : 'DEPT';

    for (const territoire of territoires) {
      if (territoire.startsWith(codeMaille) || territoire.startsWith('NAT'))
        result.push(territoire.split('-')[1]);
    }
    return result;
  }
  
}
