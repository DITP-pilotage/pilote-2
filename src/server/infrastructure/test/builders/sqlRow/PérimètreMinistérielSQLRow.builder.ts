import { perimetre } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import PérimètreMinistérielBuilder from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.builder';
import { générerUnLibellé } from '@/server/infrastructure/test/builders/utils';

export default class PérimètreMinistérielRowBuilder {
  private _id: perimetre['id'];

  private _nom: perimetre['nom'];

  private _ministère: perimetre['ministere'];

  private _ministère_id: perimetre['ministere_id'];

  constructor() {
    const périmètreMinistérielGénéré = new PérimètreMinistérielBuilder().build();
    
    this._id = périmètreMinistérielGénéré.id;
    this._nom = périmètreMinistérielGénéré.nom;
    this._ministère = faker.helpers.arrayElement([null, `${générerUnLibellé(1, 3)} ministère`]);
    this._ministère_id = this._ministère ? `MIN-${faker.datatype.number()}` : null;
  }

  avecId(id: perimetre['id']): PérimètreMinistérielRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: perimetre['nom']): PérimètreMinistérielRowBuilder {
    this._nom = nom;
    return this;
  }

  avecMinistères(ministères: perimetre['ministere']): PérimètreMinistérielRowBuilder {
    this._ministère = ministères;
    return this;
  }

  build(): perimetre {
    return {
      id: this._id,
      nom: this._nom,
      ministere: this._ministère,
      ministere_id: this._ministère_id,
    };
  }
}
