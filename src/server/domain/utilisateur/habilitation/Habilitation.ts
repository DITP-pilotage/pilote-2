import Chantier from '@/server/domain/chantier/Chantier.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Habilitations, TerritoiresFiltre } from './Habilitation.interface';

export default class Habilitation {
  constructor(private _habilitations: Habilitations) {}
  
  peutAccéderAuChantier(chantierId: Chantier['id'], territoireCode: string): boolean {
    return this._habilitations.lecture.chantiers.includes(chantierId) && this._habilitations.lecture.territoires.includes(territoireCode) ? true : false;
  }

  peutModifierLeChantier(chantierId: Chantier['id'], territoireCode: string): boolean {
    return this._habilitations['saisie.commentaire'].chantiers.includes(chantierId) && this._habilitations['saisie.commentaire'].territoires.includes(territoireCode) ? true : false;
  }

  peutSaisirLesIndicateursDuChantier(chantierId: Chantier['id'], territoireCode: string): boolean {
    return this._habilitations['saisie.indicateur'].chantiers.includes(chantierId) && this._habilitations['saisie.indicateur'].territoires.includes(territoireCode) ? true : false;
  }

  récupérerListeChantiersIdsAccessiblesEnLecture(): Chantier['id'][] {
    return this._habilitations.lecture.chantiers;
  }

  récupérerListeTerritoireCodesAccessiblesEnLecture(): string[] {
    return this._habilitations.lecture.territoires;
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
