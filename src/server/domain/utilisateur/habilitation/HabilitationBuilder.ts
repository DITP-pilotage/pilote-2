import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export class HabilitationBuilder {
  private _habilitations: Habilitations;

  constructor() {
    this._habilitations = {
      lecture: { chantiers: [], territoires: [] },
      'saisie.commentaire': { chantiers: [], territoires: [] },
      'saisie.indicateur': { chantiers: [], territoires: [] },
      'utilisateurs.lecture': { chantiers: [], territoires:[] },
      'utilisateurs.modification': { chantiers: [], territoires: [] },
      'utilisateurs.suppression': { chantiers: [], territoires: [] },
      'projetsStructurants.lecture': { projetsStructurants: [] },
    };

  }

  avecChantierIdsLecture(chantierIds: Chantier['id'][]) {
    this._habilitations.lecture.chantiers = chantierIds;
    return this;
  }

  avecTerritoireCodesLecture(territoireCodes: string[]) {
    this._habilitations.lecture.territoires = territoireCodes;
    return this;
  }

  build(): Habilitation {
    return new Habilitation(this._habilitations);
  }
}
