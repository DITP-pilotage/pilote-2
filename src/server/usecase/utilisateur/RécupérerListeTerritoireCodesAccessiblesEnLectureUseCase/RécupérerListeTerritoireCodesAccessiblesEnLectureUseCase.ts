import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default class RécupérerListeTerritoireCodesAccessiblesEnLectureUseCase {
  constructor(private _habilitation: Utilisateur['scopes']) {}

  run(): string[] {
    return this._habilitation.lecture.territoires;
  }
}
