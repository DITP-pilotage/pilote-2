import Chantier from '@/server/domain/chantier/Chantier.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default class PeutModifierLeChantierUseCase {
  constructor(private _habilitation: Utilisateur['scopes'], private _chantierId: Chantier['id'], private _territoireCode: string) {}

  run(): boolean {
    return this._habilitation['saisie.commentaire'].chantiers.includes(this._chantierId) && this._habilitation['saisie.commentaire'].territoires.includes(this._territoireCode) ? true : false;
  }
}
