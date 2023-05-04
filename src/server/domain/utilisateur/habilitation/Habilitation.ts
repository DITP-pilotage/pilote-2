import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Habilitations } from './Habilitation.interface';

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
}
