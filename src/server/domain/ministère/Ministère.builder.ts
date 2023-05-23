import { faker } from '@faker-js/faker/locale/fr';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import PérimètreMinistérielBuilder from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.builder';
import { générerPeutÊtreNull, générerUnLibellé } from '@/server/infrastructure/test/builders/utils';

const ÉCHANTILLONS_ICÔNES = [
  'remix::earth-fill',
  'google::business_center',
  'remix::seedling-fill',
  'remix::book-open-fill',
  'google::radar',
  'remix::ball-pen-fill',
  'remix::france-fill',
  'remix::alarm-warning-fill',
  'remix::scales-3-fill',
  'remix::government-fill',
  'google::school',
  'google::factory',
  'google::diversity_3',
  'remix::football-fill',
  'remix::heart-pulse-fill',
  'remix::charging-pile-2-fill',
  'remix::flag-fill,',
];

export default class MinistèreBuilder {
  private _nom: Ministère['nom'];

  private _périmètresMinistériels: Ministère['périmètresMinistériels'];

  private _icône: Ministère['icône'];

  constructor() {
    this._nom = `${générerUnLibellé(1, 3)} ministère`;
    this._périmètresMinistériels = [new PérimètreMinistérielBuilder().build()];
    this._icône = générerPeutÊtreNull(0.2, faker.helpers.arrayElement(ÉCHANTILLONS_ICÔNES));
  }

  avecNom(nom: Ministère['nom']): MinistèreBuilder {
    this._nom = nom;
    return this;
  }

  avecPérimètresMinistériels(périmètresMinistériels: Ministère['périmètresMinistériels']): MinistèreBuilder {
    this._périmètresMinistériels = périmètresMinistériels;
    return this;
  }

  avecIcône(icône: Ministère['icône']): MinistèreBuilder {
    this._icône = icône;
    return this;
  }

  build(): Ministère {
    return {
      nom: this._nom,
      périmètresMinistériels: this._périmètresMinistériels,
      icône: this._icône,
    };
  }
}
