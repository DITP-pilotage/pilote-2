import { faker } from '@faker-js/faker/locale/fr';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { NOMS_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

const infosTerritoiresSansMailleNationale: { code: Territoire['code'], codeParent: Territoire['codeParent'], nom: Territoire['nom'] }[] = [
  { code: 'DEPT-75', codeParent: 'REG-11', nom: 'Paris' },  { code: 'DEPT-07', codeParent: 'REG-84', nom: 'Ardèche' },  { code: 'DEPT-06', codeParent: 'REG-93', nom: 'Alpes-Maritimes' },
  { code: 'DEPT-95', codeParent: 'REG-11', nom: 'Val-d\'Oise' },  { code: 'DEPT-01', codeParent: 'REG-84', nom: 'Ain' },  { code: 'DEPT-02', codeParent: 'REG-32', nom: 'Aisne' },
  { code: 'DEPT-03', codeParent: 'REG-84', nom: 'Allier' },  { code: 'DEPT-04', codeParent: 'REG-93', nom: 'Alpes-de-Haute-Provence' },  { code: 'DEPT-05', codeParent: 'REG-93', nom: 'Hautes-Alpes' },
  { code: 'DEPT-90', codeParent: 'REG-27', nom: 'Territoire de Belfort' },  { code: 'DEPT-08', codeParent: 'REG-44', nom: 'Ardennes' },  { code: 'DEPT-09', codeParent: 'REG-76', nom: 'Ariège' },
  { code: 'DEPT-10', codeParent: 'REG-44', nom: 'Aube' },  { code: 'DEPT-11', codeParent: 'REG-76', nom: 'Aude' },  { code: 'DEPT-12', codeParent: 'REG-76', nom: 'Aveyron' },
  { code: 'DEPT-13', codeParent: 'REG-93', nom: 'Bouches-du-Rhône' },  { code: 'DEPT-14', codeParent: 'REG-28', nom: 'Calvados' },  { code: 'DEPT-15', codeParent: 'REG-84', nom: 'Cantal' },
  { code: 'DEPT-16', codeParent: 'REG-75', nom: 'Charente' },  { code: 'DEPT-17', codeParent: 'REG-75', nom: 'Charente-Maritime' },  { code: 'DEPT-18', codeParent: 'REG-24', nom: 'Cher' },
  { code: 'DEPT-19', codeParent: 'REG-75', nom: 'Corrèze' },  { code: 'DEPT-21', codeParent: 'REG-27', nom: 'Côte-d\'Or' },  { code: 'DEPT-22', codeParent: 'REG-53', nom: 'Côtes-d\'Armor' },
  { code: 'DEPT-23', codeParent: 'REG-75', nom: 'Creuse' },  { code: 'DEPT-24', codeParent: 'REG-75', nom: 'Dordogne' },  { code: 'DEPT-25', codeParent: 'REG-27', nom: 'Doubs' },
  { code: 'DEPT-26', codeParent: 'REG-84', nom: 'Drôme' },  { code: 'DEPT-27', codeParent: 'REG-28', nom: 'Eure' },  { code: 'DEPT-28', codeParent: 'REG-24', nom: 'Eure-et-Loir' },
  { code: 'DEPT-73', codeParent: 'REG-84', nom: 'Savoie' },  { code: 'DEPT-29', codeParent: 'REG-53', nom: 'Finistère' },  { code: 'DEPT-2A', codeParent: 'REG-94', nom: 'Corse-du-Sud' },
  { code: 'DEPT-2B', codeParent: 'REG-94', nom: 'Haute-Corse' },  { code: 'DEPT-30', codeParent: 'REG-76', nom: 'Gard' },  { code: 'DEPT-31', codeParent: 'REG-76', nom: 'Haute-Garonne' },
  { code: 'DEPT-32', codeParent: 'REG-76', nom: 'Gers' },  { code: 'DEPT-33', codeParent: 'REG-75', nom: 'Gironde' },  { code: 'DEPT-34', codeParent: 'REG-76', nom: 'Hérault' },
  { code: 'DEPT-35', codeParent: 'REG-53', nom: 'Ille-et-Vilaine' },  { code: 'DEPT-36', codeParent: 'REG-24', nom: 'Indre' },  { code: 'DEPT-37', codeParent: 'REG-24', nom: 'Indre-et-Loire' },
  { code: 'DEPT-38', codeParent: 'REG-84', nom: 'Isère' },  { code: 'DEPT-39', codeParent: 'REG-27', nom: 'Jura' },  { code: 'DEPT-40', codeParent: 'REG-75', nom: 'Landes' },
  { code: 'DEPT-41', codeParent: 'REG-24', nom: 'Loir-et-Cher' },  { code: 'DEPT-42', codeParent: 'REG-84', nom: 'Loire' },  { code: 'DEPT-43', codeParent: 'REG-84', nom: 'Haute-Loire' },
  { code: 'DEPT-44', codeParent: 'REG-52', nom: 'Loire-Atlantique' },  { code: 'DEPT-45', codeParent: 'REG-24', nom: 'Loiret' },  { code: 'DEPT-46', codeParent: 'REG-76', nom: 'Lot' },
  { code: 'DEPT-47', codeParent: 'REG-75', nom: 'Lot-et-Garonne' },  { code: 'DEPT-48', codeParent: 'REG-76', nom: '' },  { code: 'DEPT-49', codeParent: 'REG-52', nom: 'Maine-et-Loire' },
  { code: 'DEPT-50', codeParent: 'REG-28', nom: 'Manche' },  { code: 'DEPT-51', codeParent: 'REG-44', nom: 'Marne' },  { code: 'DEPT-52', codeParent: 'REG-44', nom: 'Haute-Marne' },
  { code: 'DEPT-53', codeParent: 'REG-52', nom: 'Mayenne' },  { code: 'DEPT-54', codeParent: 'REG-44', nom: 'Meurthe-et-Moselle' },  { code: 'DEPT-55', codeParent: 'REG-44', nom: 'Meuse' },
  { code: 'DEPT-56', codeParent: 'REG-53', nom: 'Morbihan' },  { code: 'DEPT-57', codeParent: 'REG-44', nom: 'Moselle' },  { code: 'DEPT-58', codeParent: 'REG-27', nom: 'Nièvre' },
  { code: 'DEPT-59', codeParent: 'REG-32', nom: 'Nord' },  { code: 'DEPT-60', codeParent: 'REG-32', nom: 'Oise' },  { code: 'DEPT-61', codeParent: 'REG-28', nom: 'Orne' },
  { code: 'DEPT-62', codeParent: 'REG-32', nom: 'Pas-de-Calais' },  { code: 'DEPT-63', codeParent: 'REG-84', nom: 'Puy-de-Dôme' },  { code: 'DEPT-64', codeParent: 'REG-75', nom: 'Pyrénées-Atlantiques' },
  { code: 'DEPT-65', codeParent: 'REG-76', nom: 'Hautes-Pyrénées' },  { code: 'DEPT-66', codeParent: 'REG-76', nom: 'Pyrénées-Orientales' },  { code: 'DEPT-67', codeParent: 'REG-44', nom: 'Bas-Rhin' },
  { code: 'DEPT-68', codeParent: 'REG-44', nom: 'Haut-Rhin' },  { code: 'DEPT-69', codeParent: 'REG-84', nom: 'Rhône' },  { code: 'DEPT-70', codeParent: 'REG-27', nom: 'Haute-Saône' },
  { code: 'DEPT-71', codeParent: 'REG-27', nom: 'Saône-et-Loire' },  { code: 'DEPT-72', codeParent: 'REG-52', nom: 'Sarthe' },  { code: 'DEPT-74', codeParent: 'REG-84', nom: 'Haute-Savoie' },
  { code: 'DEPT-76', codeParent: 'REG-28', nom: 'Seine-Maritime' },  { code: 'DEPT-77', codeParent: 'REG-11', nom: 'Seine-et-Marne' },  { code: 'DEPT-78', codeParent: 'REG-11', nom: 'Yvelines' },
  { code: 'DEPT-79', codeParent: 'REG-75', nom: 'Deux-Sèvres' },  { code: 'DEPT-80', codeParent: 'REG-32', nom: 'Somme' },  { code: 'DEPT-81', codeParent: 'REG-76', nom: 'Tarn' },
  { code: 'DEPT-82', codeParent: 'REG-76', nom: 'Tarn-et-Garonne' },  { code: 'DEPT-83', codeParent: 'REG-93', nom: 'Var' },  { code: 'DEPT-84', codeParent: 'REG-93', nom: 'Vaucluse' },
  { code: 'DEPT-85', codeParent: 'REG-52', nom: 'Vendée' },  { code: 'DEPT-86', codeParent: 'REG-75', nom: 'Vienne' },  { code: 'DEPT-87', codeParent: 'REG-75', nom: 'Haute-Vienne' },
  { code: 'DEPT-88', codeParent: 'REG-44', nom: 'Vosges' },  { code: 'DEPT-89', codeParent: 'REG-27', nom: 'Yonne' },  { code: 'DEPT-91', codeParent: 'REG-11', nom: 'Essonne' },
  { code: 'DEPT-92', codeParent: 'REG-11', nom: 'Hauts-de-Seine' },  { code: 'DEPT-93', codeParent: 'REG-11', nom: 'Seine-Saint-Denis' },  { code: 'DEPT-94', codeParent: 'REG-11', nom: 'Val-de-Marne' },
  { code: 'DEPT-971', codeParent: 'REG-01', nom: 'Guadeloupe' }, { code: 'DEPT-972', codeParent: 'REG-02', nom: 'Martinique' }, { code: 'DEPT-973', codeParent: 'REG-03', nom: 'Guyane' },
  { code: 'DEPT-974', codeParent: 'REG-04', nom: 'La Réunion' }, { code: 'DEPT-976', codeParent: 'REG-06', nom: 'Mayotte' }, { code: 'REG-06', codeParent: null, nom: 'Mayotte' }, { code: 'REG-84', codeParent: null, nom: 'Auvergne-Rhône-Alpes' }, 
  { code: 'REG-32', codeParent: null, nom: 'Hauts-de-France' }, { code: 'REG-93', codeParent: null, nom: 'Provence - Alpes - Côte d\'Azur' }, { code: 'REG-44', codeParent: null, nom: 'Grand-Est' },
  { code: 'REG-76', codeParent: null, nom: 'Occitanie' }, { code: 'REG-28', codeParent: null, nom: 'Normandie' }, { code: 'REG-75', codeParent: null, nom: 'Nouvelle Aquitaine' }, { code: 'REG-24', codeParent: null, nom: 'Centre-Val de Loire' },
  { code: 'REG-27', codeParent: null, nom: 'Bourgogne-Franche-Comté' }, { code: 'REG-53', codeParent: null, nom: 'Bretagne' }, { code: 'REG-94', codeParent: null, nom: 'Corse' }, { code: 'REG-52', codeParent: null, nom: 'Pays de la Loire' }, 
  { code: 'REG-11', codeParent: null, nom: 'Île-de-France' }, { code: 'REG-01', codeParent: null, nom: 'Guadeloupe' }, { code: 'REG-02', codeParent: null, nom: 'Martinique' }, { code: 'REG-03', codeParent: null, nom: 'Guyane' },
  { code: 'REG-04', codeParent: null, nom: 'La Réunion' },
];

export const fakeTerritoires = [...infosTerritoiresSansMailleNationale, { code: 'NAT-FR', codeParent: null, nom: 'France' }];

export default class TerritoireBuilder {

  private _territoire: typeof infosTerritoiresSansMailleNationale[number];

  private _code: Territoire['code'];

  private _nom: Territoire['nom'];

  private _nomAffiché: Territoire['nomAffiché'];

  private _codeInsee: Territoire['codeInsee'];

  private _codeParent: Territoire['codeParent'];

  private _maille: Territoire['maille'];

  constructor() {
    this._territoire = faker.helpers.arrayElement(infosTerritoiresSansMailleNationale);
    this._code = this._territoire.code;
    this._codeParent = this._territoire.codeParent;
    this._nom = this._territoire.nom;
    this._codeInsee = territoireCodeVersMailleCodeInsee(this._code).codeInsee;
    this._maille = NOMS_MAILLES[territoireCodeVersMailleCodeInsee(this._code).maille] as MailleInterne;
    this._nomAffiché = this._maille === 'départementale' ? `${this._codeInsee} - ${this._nom}` : this._nom;
  }

  avecCodeInsee(codeInsee: Territoire['codeInsee']): TerritoireBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecCode(code: Territoire['code']): TerritoireBuilder {
    this._code = code;
    return this;
  }

  avecMaille(maille: Territoire['maille']): TerritoireBuilder {
    this._maille = maille;
    return this;
  }

  avecMailleNationale(): TerritoireBuilder {
    this._code = 'NAT-FR';
    this._codeParent = null;
    this._nom = 'France';
    this._codeInsee = 'FR';
    this._maille = 'nationale';
    this._nomAffiché = this._nom;
    return this;
  }

  build(): Territoire {
    return {
      code: this._code,
      nom: this._nom,
      nomAffiché: this._nomAffiché,
      codeInsee: this._codeInsee,
      maille: this._maille,
      codeParent: this._codeParent,
      tracéSvg: '',
    };
  }
}
