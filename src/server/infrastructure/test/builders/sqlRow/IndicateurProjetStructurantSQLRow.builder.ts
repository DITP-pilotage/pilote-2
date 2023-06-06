import { indicateur_projet_structurant } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { typesIndicateurProjetStructurant } from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurantBuilder from '@/server/domain/projetStructurant/ProjetStructurant.builder';
import { générerPeutÊtreNull, générerUnIdentifiantUnique } from '@/server/infrastructure/test/builders/utils';

export default class IndicateurProjetStructurantRowBuilder {
  private _id: indicateur_projet_structurant['id'];

  private _nom: indicateur_projet_structurant['nom'];

  private _projetStructurantCode: indicateur_projet_structurant['projet_structurant_code'];

  private _typeId: indicateur_projet_structurant['type_id'];

  private _description: indicateur_projet_structurant['description'];

  private _source: indicateur_projet_structurant['source'];
   
  private _modeDeCalcul: indicateur_projet_structurant['mode_de_calcul'];

  constructor() {
    const projetStructantGénéré = new ProjetStructurantBuilder().build();

    this._id = générerUnIdentifiantUnique('IND');
    this._nom = `${this._id} ${faker.lorem.words()}`;
    this._typeId = faker.helpers.arrayElement(typesIndicateurProjetStructurant);
    this._description = générerPeutÊtreNull(0.2, faker.lorem.paragraph(2));
    this._source = générerPeutÊtreNull(0.2, faker.lorem.paragraph(2));
    this._modeDeCalcul = générerPeutÊtreNull(0.2, faker.lorem.paragraph(5));
    this._projetStructurantCode = projetStructantGénéré.id;
  }

  avecProjetStructurantCode(projetStructurantCode: indicateur_projet_structurant['projet_structurant_code']): IndicateurProjetStructurantRowBuilder {
    this._projetStructurantCode = projetStructurantCode;
    return this;
  }

  build(): indicateur_projet_structurant {
    return {
      id: this._id,
      nom: this._nom,
      type_id: this._typeId,
      description: this._description,
      source: this._source,
      mode_de_calcul: this._modeDeCalcul,
      projet_structurant_code: this._projetStructurantCode,
    };
  }

}
