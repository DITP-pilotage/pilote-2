import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export class HabilitationBuilder {
  private _habilitations: Habilitations;

  constructor() {
    this._habilitations = {
      lecture: { chantiers: [], territoires: [], périmètres: [] },
      'saisieCommentaire': { chantiers: [], territoires: [], périmètres: [] },
      'saisieIndicateur': { chantiers: [], territoires: [], périmètres: [] },
      'utilisateurs.lecture': { chantiers: [], territoires:[], périmètres: [] },
      'utilisateurs.modification': { chantiers: [], territoires: [], périmètres: [] },
      'utilisateurs.suppression': { chantiers: [], territoires: [], périmètres: [] },
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

  avecPérimètreIdsLecture(périmètresIds: PérimètreMinistériel['id'][]) {
    this._habilitations.lecture.périmètres = périmètresIds;
    return this;
  }

  build(): Habilitation {
    return new Habilitation(this._habilitations);
  }
}
