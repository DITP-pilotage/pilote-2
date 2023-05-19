import { faker } from '@faker-js/faker/locale/fr';
import {  générerCaractèresSpéciaux, générerUnLibellé } from '@/server/infrastructure/test/builders/utils';
import MinistèreBuilder from '@/server/domain/ministère/Ministère.builder';
import { ProjetStructurantPrisma } from '@/server/infrastructure/accès_données/projetStructurant/ProjetStructurantSQLRepository';
import ProjetStructurantBuilder from '@/server/domain/projetStructurant/ProjetStructurant.builder';

export default class ProjetStructurantRowBuilder {
  private _id: ProjetStructurantPrisma['id'] = '';

  private _code: ProjetStructurantPrisma['code'] = '';

  private _nom: ProjetStructurantPrisma['nom'] = '';
  
  private _codeTerritoire: ProjetStructurantPrisma['code_territoire'] = '';

  private _directionAdministration: ProjetStructurantPrisma['direction_administration'] = [];

  private _périmètreIds: ProjetStructurantPrisma['perimetres_ids'] = [];

  private _chefferieDeProjet: ProjetStructurantPrisma['chefferie_de_projet'] = [];

  private _coporteur: ProjetStructurantPrisma['co_porteur'] = [];


  constructor() {
    this.initialise();
  }
  
  async initialise() {
    const projetGénéré = await new ProjetStructurantBuilder().build();
    const ministères = faker.helpers.arrayElement([
      [new MinistèreBuilder().build()],
      [new MinistèreBuilder().build(), new MinistèreBuilder().build()],
    ]);
  
    this._id = projetGénéré.id;
    this._code = projetGénéré.codeInsee;
    this._nom = `${générerUnLibellé(6, 14)} ${générerCaractèresSpéciaux(3)} ${this._id}`;
    this._codeTerritoire = projetGénéré.codeTerritoire;
    this._périmètreIds = ministères.flatMap(ministère => ministère.périmètresMinistériels).map(périmètreMinistériel => périmètreMinistériel.id);
    this._directionAdministration = projetGénéré.responsables.directionAdmininstration;
    this._chefferieDeProjet = projetGénéré.responsables.chefferieDeProjet;
    this._coporteur = projetGénéré.responsables.coporteurs;
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

  avecPérimètreIds(périmètreIds: ProjetStructurantPrisma['perimetres_ids']): ProjetStructurantRowBuilder {
    this._périmètreIds = périmètreIds;
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
      code_territoire: this._codeTerritoire,
      direction_administration: this._directionAdministration,
      perimetres_ids: this._périmètreIds,
      chefferie_de_projet: this._chefferieDeProjet,
      co_porteur: this._coporteur,
    };
  }
}
