import { faker } from '@faker-js/faker/locale/fr';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import PérimètreMinistérielBuilder from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.builder';
import {
  générerPeutÊtreNull,
  générerUnIdentifiantUnique,
  générerUnLibellé,
} from '@/server/infrastructure/test/builders/utils';

const ÉCHANTILLONS_ICÔNES = [
  'material-icons::diversity_3::filled',
  'remix::flag::fill',
  'remix::football::fill',
  'remix::ball-pen::fill',
  'remix::scales-3::fill',
  'material-icons::business_center::filled',
  'remix::government::fill',
  'remix::alarm-warning::fill',
  'remix::book-open::fill',
  'material-icons::factory::filled',
  'material-icons::radar::filled',
  'remix::charging-pile-2::fill',
  'dsfr::france::fill',
  'material-symbols::equal::outlined',
  'remix::earth::fill',
  'remix::seedling::fill',
  'remix::heart-pulse::fill',
];

export default class MinistèreBuilder {
  private _id: Ministère['id'];

  private _nom: Ministère['nom'];

  private _périmètresMinistériels: Ministère['périmètresMinistériels'];

  private _icône: Ministère['icône'];

  constructor() {
    this._id = générerUnIdentifiantUnique('MIN');
    this._nom = `${générerUnLibellé(1, 3)} ministère`;
    this._périmètresMinistériels = [new PérimètreMinistérielBuilder().build()];
    this._icône = générerPeutÊtreNull(0.2, faker.helpers.arrayElement(ÉCHANTILLONS_ICÔNES));
  }

  avecId(id: Ministère['id']): MinistèreBuilder {
    this._id = id;
    return this;
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
      id: this._id,
      nom: this._nom,
      périmètresMinistériels: this._périmètresMinistériels,
      icône: this._icône,
    };
  }
}
