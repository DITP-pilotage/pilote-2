import { perimetre } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { générerUnTableauVideAvecUneTailleDeZéroÀn } from '@/server/infrastructure/test/builders/utils';
import PérimètreMinistérielBuilder from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.builder';

export default class PérimètreMinistérielRowBuilder {
  private _id: perimetre['id'];

  private _nom: perimetre['nom'];

  private _ministères: perimetre['ministere'];

  constructor() {
    const périmètreMinistérielGénéré = new PérimètreMinistérielBuilder().build();
    const ministèreGénéré = générerUnTableauVideAvecUneTailleDeZéroÀn(3).map(() => `MIN - ${faker.lorem.words()}`).join(',');
    
    this._id = périmètreMinistérielGénéré.id;
    this._nom = périmètreMinistérielGénéré.nom;
    this._ministères = faker.helpers.arrayElement([null, ministèreGénéré]);
  }

  avecId(id: typeof this._id): PérimètreMinistérielRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: typeof this._nom): PérimètreMinistérielRowBuilder {
    this._nom = nom;
    return this;
  }

  avecMinistères(ministères: typeof this._ministères): PérimètreMinistérielRowBuilder {
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
