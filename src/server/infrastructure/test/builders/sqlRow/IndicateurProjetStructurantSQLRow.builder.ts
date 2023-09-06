import { indicateur_projet_structurant } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { typesIndicateurProjetStructurant } from '@/server/domain/indicateur/Indicateur.interface';
import { générerPeutÊtreNull, générerUnIdentifiantUnique } from '@/server/infrastructure/test/builders/utils';
import ProjetStructurantRowBuilder from './ProjetStructurantSQLRow.builder';

export default class IndicateurProjetStructurantRowBuilder {
  private _id: indicateur_projet_structurant['id'];

  private _nom: indicateur_projet_structurant['nom'];

  private _projetStructurantId: indicateur_projet_structurant['projet_structurant_id'];

  private _projetStructurantCode: indicateur_projet_structurant['projet_structurant_code'];

  private _typeId: indicateur_projet_structurant['type_id'];

  private _description: indicateur_projet_structurant['description'];

  private _source: indicateur_projet_structurant['source'];
   
  private _modeDeCalcul: indicateur_projet_structurant['mode_de_calcul'];

  private _valeurActuelle: indicateur_projet_structurant['valeur_actuelle'];

  private _valeurInitiale: indicateur_projet_structurant['valeur_initiale'];

  private _valeurCible: indicateur_projet_structurant['valeur_cible'];

  private _tauxAvancement: indicateur_projet_structurant['taux_avancement'];

  private _dateValeurActuelle: indicateur_projet_structurant['date_valeur_actuelle'];

  private _dateValeurInitiale: indicateur_projet_structurant['date_valeur_initiale'];

  private _dateValeurCible: indicateur_projet_structurant['date_valeur_cible'];

  private _dateTauxAvancement: indicateur_projet_structurant['date_taux_avancement'];

  private _a_supprimer: indicateur_projet_structurant['a_supprimer'];

  constructor() {
    const projetStructantGénéré = new ProjetStructurantRowBuilder().build();

    this._id = générerUnIdentifiantUnique('IND');
    this._nom = `${this._id} ${faker.lorem.words()}`;
    this._typeId = faker.helpers.arrayElement(typesIndicateurProjetStructurant);
    this._description = générerPeutÊtreNull(0.2, faker.lorem.paragraph(2));
    this._source = générerPeutÊtreNull(0.2, faker.lorem.paragraph(2));
    this._modeDeCalcul = générerPeutÊtreNull(0.2, faker.lorem.paragraph(5));
    this._projetStructurantId = projetStructantGénéré.id;
    this._projetStructurantCode = projetStructantGénéré.code;
    this._valeurInitiale = faker.datatype.number({ precision: 0.01 });
    this._valeurCible = faker.datatype.number({ min: this._valeurInitiale ?? 42, precision: 0.01 });  
    this._valeurActuelle = faker.datatype.number({ min: this._valeurInitiale, max: this._valeurCible, precision: 0.01 });
    this._tauxAvancement = générerPeutÊtreNull(0.1, faker.datatype.number({ min: 0, max: 100, precision: 0.01 }));
    this._dateValeurInitiale = new Date('2020-06-01');
    this._dateValeurActuelle = new Date('2023-06-01');
    this._dateValeurCible = new Date('2024-06-01');
    this._dateTauxAvancement = new Date('2023-06-01');
    this._a_supprimer = false;
  }

  avecProjetStructurantId(projetStructurantId: indicateur_projet_structurant['projet_structurant_id']): IndicateurProjetStructurantRowBuilder {
    this._projetStructurantId = projetStructurantId;
    return this;
  }

  build(): indicateur_projet_structurant {
    return {
      id: this._id,
      nom: this._nom,
      projet_structurant_code: this._projetStructurantCode,
      projet_structurant_id: this._projetStructurantId,
      type_id: this._typeId,
      description: this._description,
      source: this._source,
      mode_de_calcul: this._modeDeCalcul,
      valeur_initiale: this._valeurInitiale,
      valeur_actuelle: this._valeurActuelle,
      valeur_cible: this._valeurCible,
      taux_avancement: this._tauxAvancement,
      date_valeur_initiale: this._dateValeurInitiale,
      date_valeur_actuelle: this._dateValeurActuelle,
      date_valeur_cible: this._dateValeurCible,
      date_taux_avancement: this._dateTauxAvancement,
      a_supprimer: this._a_supprimer,
    };
  }

}
