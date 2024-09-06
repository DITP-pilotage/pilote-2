import { faker } from '@faker-js/faker/locale/fr';
import Indicateur, { typesIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { générerPeutÊtreNull, générerUnIdentifiantUnique } from '@/server/infrastructure/test/builders/utils';

export default class IndicateurBuilder {
  private _id: Indicateur['id'];

  private _nom: Indicateur['nom'];

  private _type: Indicateur['type'];

  private _estIndicateurDuBaromètre: Indicateur['estIndicateurDuBaromètre'];

  private _description: Indicateur['description'];

  private _source: Indicateur['source'];

  private _modeDeCalcul: Indicateur['modeDeCalcul'];

  private _unité: Indicateur['unité'];

  private _parentId: Indicateur['parentId'];

  private _periodicite: Indicateur['periodicite'];

  private _delaiDisponibilite: Indicateur['delaiDisponibilite'];

  constructor() {
    this._id = générerUnIdentifiantUnique('IND');
    this._nom = `${this._id} ${faker.lorem.words()}`;
    this._type = faker.helpers.arrayElement(typesIndicateur);
    this._estIndicateurDuBaromètre = faker.datatype.boolean();
    this._description = générerPeutÊtreNull(0.2, faker.lorem.paragraph(2));
    this._source = générerPeutÊtreNull(0.2, faker.lorem.paragraph(2));
    this._modeDeCalcul = générerPeutÊtreNull(0.2, faker.lorem.paragraph(5));
    this._unité = générerPeutÊtreNull(0.2, faker.lorem.paragraph(2));
    this._parentId = null;
    this._periodicite = faker.helpers.arrayElement(['Annuelle', 'Mensuelle', '3 ans']);
    this._delaiDisponibilite = faker.datatype.bigInt({ min: 10, max: 100 }).toString();
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

  build(): Indicateur {
    return {
      id: this._id,
      nom: this._nom,
      type: this._type,
      estIndicateurDuBaromètre: this._estIndicateurDuBaromètre,
      description: this._description,
      source: this._source,
      modeDeCalcul: this._modeDeCalcul,
      unité: this._unité,
      parentId: this._parentId,
      periodicite: this._periodicite,
      delaiDisponibilite: this._delaiDisponibilite,
    };
  }
}
