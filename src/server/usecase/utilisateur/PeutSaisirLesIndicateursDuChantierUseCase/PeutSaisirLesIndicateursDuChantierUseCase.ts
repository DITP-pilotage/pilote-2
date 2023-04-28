import Chantier from '@/server/domain/chantier/Chantier.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default class PeutSaisirLesIndicateursDuChantierUseCase {
  constructor(private _habilitation: Utilisateur['scopes'], private _chantierId: Chantier['id'], private _territoireCode: string) {}

  run(): boolean {
    return this._habilitation['saisie.indicateur'].chantiers.includes(this._chantierId) && this._habilitation['saisie.indicateur'].territoires.includes(this._territoireCode) ? true : false;
  }
}
