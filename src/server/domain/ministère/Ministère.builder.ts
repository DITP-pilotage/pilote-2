import { faker } from '@faker-js/faker/locale/fr';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import PérimètreMinistérielBuilder from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.builder';

export default class MinistèreBuilder {
  private _nom: Ministère['nom'];

  private _périmètresMinistériels: Ministère['périmètresMinistériels'];

  constructor() {
    this._nom = `MIN - ${faker.lorem.words()}`;
    this._périmètresMinistériels = [new PérimètreMinistérielBuilder().build()];
  }

  avecNom(nom: Ministère['nom']): MinistèreBuilder {
    this._nom = nom;
    return this;
  }

  avecPérimètresMinistériels(périmètresMinistériels: Ministère['périmètresMinistériels']): MinistèreBuilder {
    this._périmètresMinistériels = périmètresMinistériels;
    return this;
  }

  build(): Ministère {
    return {
      nom: this._nom,
      périmètresMinistériels: this._périmètresMinistériels,
    };
  }
}
