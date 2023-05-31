import { faker } from '@faker-js/faker/locale/fr';
import { projet_structurant as ProjetStructurantPrisma } from '@prisma/client';
import {  générerCaractèresSpéciaux, générerUnLibellé } from '@/server/infrastructure/test/builders/utils';
import MinistèreBuilder from '@/server/domain/ministère/Ministère.builder';
import ProjetStructurantBuilder from '@/server/domain/projetStructurant/ProjetStructurant.builder';


export default class ProjetStructurantRowBuilder {
  private _id: ProjetStructurantPrisma['id'] = '';

  private _code: ProjetStructurantPrisma['code'] = '';

  private _nom: ProjetStructurantPrisma['nom'] = '';
  
  private _territoireCode: ProjetStructurantPrisma['territoire_code'] = '';

  private _directionAdministration: ProjetStructurantPrisma['direction_administration'] = [];

  private _périmètreIds: ProjetStructurantPrisma['perimetres_ids'] = [];

  private _chefferieDeProjet: ProjetStructurantPrisma['chefferie_de_projet'] = [];

  private _coporteurs: ProjetStructurantPrisma['co_porteurs'] = [];

  constructor() {
    const projetGénéré =  new ProjetStructurantBuilder().build();
    const ministèrePorteur = new MinistèreBuilder().build();
    const ministèresCoPorteurs = faker.helpers.arrayElement([
      [new MinistèreBuilder().build()],
      [new MinistèreBuilder().build(), new MinistèreBuilder().build()],
    ]);
  
    this._id = projetGénéré.id;
    this._code = projetGénéré.codeInsee;
    this._nom = `${générerUnLibellé(6, 14)} ${générerCaractèresSpéciaux(3)} ${this._id}`;
    this._territoireCode = projetGénéré.codeTerritoire;
    this._périmètreIds = [faker.helpers.arrayElement(ministèrePorteur.périmètresMinistériels).id, ...ministèresCoPorteurs.map(ministère => faker.helpers.arrayElement(ministère.périmètresMinistériels).id)];
    this._directionAdministration = projetGénéré.responsables.directionAdmininstration;
    this._chefferieDeProjet = projetGénéré.responsables.chefferieDeProjet;
    this._coporteurs = projetGénéré.responsables.coporteurs;
  }

  avecId(id: ProjetStructurantPrisma['id']): ProjetStructurantRowBuilder {
    this._id = id;
    this._nom = `${générerUnLibellé(6, 14)} ${générerCaractèresSpéciaux(3)} ${this._id}`;
    return this;
  }

  avecNom(nom: ProjetStructurantPrisma['nom']): ProjetStructurantRowBuilder {
    this._nom = nom;
    return this;
  }

  avecPérimètresIds(périmètreIds: ProjetStructurantPrisma['perimetres_ids']): ProjetStructurantRowBuilder {
    this._périmètreIds = périmètreIds;
    return this;
  }

  avecTerritoireCode(territoireCode: ProjetStructurantPrisma['territoire_code']): ProjetStructurantRowBuilder {
    this._territoireCode = territoireCode;
    return this;
  }
  
  shallowCopy(): ProjetStructurantRowBuilder {
    const result = new ProjetStructurantRowBuilder() as any;
    for (const attribut in this) {
      result[attribut] = this[attribut];
    }
    return result as ProjetStructurantRowBuilder;
  }

  build(): ProjetStructurantPrisma {
    return {
      id: this._id,
      code: this._code,
      nom: this._nom,
      territoire_code: this._territoireCode,
      direction_administration: this._directionAdministration,
      perimetres_ids: this._périmètreIds,
      chefferie_de_projet: this._chefferieDeProjet,
      co_porteurs: this._coporteurs,
    };
  }
}
