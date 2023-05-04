import Chantier from '@/server/domain/chantier/Chantier.interface';
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

  récupérerMailleEtCodeEnLecture() : TerritoiresFiltre{
    const territoires = this.récupérerListeTerritoireCodesAccessiblesEnLecture();
    const result = {
      REG: {maille: 'régionale', territoires: [] as string[]},
      DEPT: {maille: 'départementale', territoires: [] as string[]},
      NAT: {maille: 'nationale', territoires: [] as string[]}
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
}
