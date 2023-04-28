import Chantier from '@/server/domain/chantier/Chantier.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default class RécupérerListeChantierIdsAccessiblesEnLectureUseCase {
  constructor(private _habilitation: Utilisateur['scopes']) {}

  run(): Chantier['id'][] {
    return this._habilitation.lecture.chantiers;
  }
}
