import { perimetre } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import PérimètreMinistérielBuilder from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.builder';

export default class PérimètreMinistérielRowBuilder {
  private _id: perimetre['id'];

  private _nom: perimetre['nom'];

  private _ministères: perimetre['ministere'];

  constructor() {
    const périmètreMinistérielGénéré = new PérimètreMinistérielBuilder().build();
    
    this._id = périmètreMinistérielGénéré.id;
    this._nom = périmètreMinistérielGénéré.nom;
    this._ministères = faker.helpers.arrayElement([null, `MIN - ${faker.lorem.words()}`]);
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
    this._ministères = ministères;
    return this;
  }

  build(): perimetre {
    return {
      id: this._id,
      nom: this._nom,
      ministere: this._ministères,
    };
  }
}
