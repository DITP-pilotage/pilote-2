import { faker } from '@faker-js/faker';
import Indicateur, { typesIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { générerUnIdentifiantUnique } from '../../../tests/builders/utils';

export default class IndicateurBuilder {
  private _id: Indicateur['id'];

  private _nom: Indicateur['nom'];

  private _type: Indicateur['type'];

  private _estIndicateurDuBaromètre: Indicateur['estIndicateurDuBaromètre'];

  private _description: Indicateur['description'];

  private _source: Indicateur['source'];

  private _modeDeCalcul: Indicateur['modeDeCalcul'];

  constructor() {
    this._id = générerUnIdentifiantUnique('IND');
    this._nom = `${this._id} ${faker.lorem.words()}`;
    this._type = faker.helpers.arrayElement(typesIndicateur);
    this._estIndicateurDuBaromètre = faker.datatype.boolean();
    this._description = faker.helpers.arrayElement([null, faker.lorem.sentence()]);
    this._source = faker.helpers.arrayElement([null, faker.lorem.sentence()]);
    this._modeDeCalcul = faker.helpers.arrayElement([null, faker.lorem.sentence()]);
  }

  avecId(id: typeof this._id): IndicateurBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: typeof this._nom): IndicateurBuilder {
    this._nom = nom;
    return this;
  }

  avecType(type: typeof this._type): IndicateurBuilder {
    this._type = type;
    return this;
  }

  avecEstIndicateurDuBaromètre(estIndicateurDuBaromètre: typeof this._estIndicateurDuBaromètre): IndicateurBuilder {
    this._estIndicateurDuBaromètre = estIndicateurDuBaromètre;
    return this;
  }

  avecDescription(description: typeof this._description): IndicateurBuilder {
    this._description = description;
    return this;
  }

  avecSource(source: typeof this._source): IndicateurBuilder {
    this._source = source;
    return this;
  }

  avecModeDeCalcul(modeDeCalcul: typeof this._modeDeCalcul): IndicateurBuilder {
    this._modeDeCalcul = modeDeCalcul;
    return this;
  }

  build(): Indicateur {
    return {
      id: this._id,
      nom: this._nom,
      type: this._type,
      estIndicateurDuBaromètre: this._estIndicateurDuBaromètre,
      description: this._description,
      source: this._source,
      modeDeCalcul: this._modeDeCalcul,
    };
  }
}
