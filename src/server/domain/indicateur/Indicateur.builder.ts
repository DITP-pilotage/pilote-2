import { faker } from '@faker-js/faker/locale/fr';
import Indicateur, { typesIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { générerUnIdentifiantUnique } from '@/server/infrastructure/test/builders/utils';

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
    this._description = faker.helpers.arrayElement([null, faker.lorem.paragraph(2)]);
    this._source = faker.helpers.arrayElement([null, faker.lorem.paragraph(2)]);
    this._modeDeCalcul = faker.helpers.arrayElement([null, faker.lorem.paragraph(5)]);
  }

  avecId(id: Indicateur['id']): IndicateurBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: Indicateur['nom']): IndicateurBuilder {
    this._nom = nom;
    return this;
  }

  avecType(type: Indicateur['type']): IndicateurBuilder {
    this._type = type;
    return this;
  }

  avecEstIndicateurDuBaromètre(estIndicateurDuBaromètre: Indicateur['estIndicateurDuBaromètre']): IndicateurBuilder {
    this._estIndicateurDuBaromètre = estIndicateurDuBaromètre;
    return this;
  }

  avecDescription(description: Indicateur['description']): IndicateurBuilder {
    this._description = description;
    return this;
  }

  avecSource(source: Indicateur['source']): IndicateurBuilder {
    this._source = source;
    return this;
  }

  avecModeDeCalcul(modeDeCalcul: Indicateur['modeDeCalcul']): IndicateurBuilder {
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
