import { ministere } from '@prisma/client';
import {
  générerUnIdentifiantUnique,
} from '@/server/infrastructure/test/builders/utils';
import MinistèreBuilder from '@/server/domain/ministère/Ministère.builder';

export default class MinistèreSQLRowBuilder {
  private _id: ministere['id'];

  private _acronyme: ministere['acronyme'];

  private _nom: string;

  private _icone: string | null;

  private _a_supprimer: boolean;
  
  constructor() {
    const ministèreGénéré = new MinistèreBuilder().build();
    
    this._id = générerUnIdentifiantUnique('MIN');
    this._acronyme = ministèreGénéré.acronyme;
    this._nom = ministèreGénéré.nom;
    this._icone = ministèreGénéré.icône;
    this._a_supprimer = false;
  }

  avecId(id: ministere['id']): MinistèreSQLRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: ministere['nom']): MinistèreSQLRowBuilder {
    this._nom = nom;
    return this;
  }

  avecIcône(icone: ministere['icone']): MinistèreSQLRowBuilder {
    this._icone = icone;
    return this;
  }

  avecAcronyme(acronyme: ministere['acronyme']): MinistèreSQLRowBuilder {
    this._acronyme = acronyme;
    return this;
  }

  build(): ministere {
    return {
      id: this._id,
      acronyme: this._acronyme,
      nom: this._nom,
      icone: this._icone,
      a_supprimer: this._a_supprimer,
    };
  }
}
