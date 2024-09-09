import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export class HabilitationBuilder {
  private readonly _habilitations: Habilitations;

  constructor() {
    this._habilitations = {
      lecture: { chantiers: [], territoires: [], périmètres: [] },
      saisieCommentaire: { chantiers: [], territoires: [], périmètres: [] },
      saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
      gestionUtilisateur: { chantiers: [], territoires:[], périmètres: [] },
      responsabilite: { chantiers: [], territoires: [], périmètres: [] },
      'projetsStructurants.lecture': { projetsStructurants: [] },
    };

  }

  avecTerritoireCodesLecture(territoireCodes: string[]) {
    this._habilitations.lecture.territoires = territoireCodes;
    return this;
  }

  build(): Habilitation {
    return new Habilitation(this._habilitations);
  }
}
