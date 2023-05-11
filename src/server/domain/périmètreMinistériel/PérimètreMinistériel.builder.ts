import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { générerUnIdentifiantUnique, générerUnLibellé } from '@/server/infrastructure/test/builders/utils';

export default class PérimètreMinistérielBuilder {
  private _id: PérimètreMinistériel['id'];

  private _nom: PérimètreMinistériel['nom'];

  private _minister_id: PérimètreMinistériel['ministere_id'];

  constructor() {
    this._id = générerUnIdentifiantUnique('PM');
    this._nom = `${générerUnLibellé(1, 3)} périmètre`;
    this._minister_id = générerUnIdentifiantUnique('M');
  }

  avecId(id: PérimètreMinistériel['id']): PérimètreMinistérielBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: PérimètreMinistériel['nom']): PérimètreMinistérielBuilder {
    this._nom = nom;
    return this;
  }

  build(): PérimètreMinistériel {
    return {
      id: this._id,
      nom: this._nom,
      ministere_id: this._minister_id,
    };
  }
}
