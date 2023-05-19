import { faker } from '@faker-js/faker/locale/fr';
import {
  générerCaractèresSpéciaux,
  générerPeutÊtreNull,
  générerUnIdentifiantUnique,
  générerUnLibellé,
  générerUnTableauVideAvecUneTailleDeZéroÀn,
  retourneUneListeDeCodeInseeCohérentePourUneMaille,
} from '@/server/infrastructure/test/builders/utils';
import MinistèreBuilder from '@/server/domain/ministère/Ministère.builder';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import RécupérerDétailsTerritoireUseCase from '@/server/usecase/territoire/RécupérerDétailsTerritoireUseCase';
import ProjetStructurant from './ProjetStructurant.interface';


export default class ProjetStructurantBuilder {
  private _id: ProjetStructurant['id'];

  private _nom: ProjetStructurant['nom'];

  private _maille: ProjetStructurant['maille'];

  private _codeInsee: ProjetStructurant['codeInsee'];

  private _périmètreIds: ProjetStructurant['périmètresIds'];

  private _avancement: ProjetStructurant['avancement'];

  private _dateAvancement: ProjetStructurant['dateAvancement'];

  private _météo: ProjetStructurant['météo'];

  private _ministèrePorteur: ProjetStructurant['responsables']['ministèrePorteur'];

  private _ministèresCoporteurs: ProjetStructurant['responsables']['ministèresCoporteurs'];

  private _directionAdmininstration: ProjetStructurant['responsables']['directionAdmininstration'];

  private _chefferieDeProjet: ProjetStructurant['responsables']['chefferieDeProjet'];

  private _coporteurs: ProjetStructurant['responsables']['coporteurs'];

  constructor() {
    const ministèrePorteur = new MinistèreBuilder().build();
    const ministèresCoPorteurs = générerUnTableauVideAvecUneTailleDeZéroÀn(2).map(() => new MinistèreBuilder().build().nom);
    const directionAdmininstration = générerUnTableauVideAvecUneTailleDeZéroÀn(2).map(() => faker.name.fullName());
    const chefferieDeProjet = générerUnTableauVideAvecUneTailleDeZéroÀn(2).map(() => faker.name.fullName());
    const coporteurs = générerUnTableauVideAvecUneTailleDeZéroÀn(2).map(() => faker.name.fullName());

    this._id = générerUnIdentifiantUnique('PS');
    this._nom = `${générerUnLibellé(6, 14)} ${générerCaractèresSpéciaux(3)} ${this._id}`;
    this._périmètreIds = ministèrePorteur.périmètresMinistériels.map(périmètreMinistériel => périmètreMinistériel.id);
    this._maille = faker.helpers.arrayElement(['départementale', 'régionale']);
    this._codeInsee = faker.helpers.arrayElement(retourneUneListeDeCodeInseeCohérentePourUneMaille(CODES_MAILLES[this._maille]));
    this._avancement = générerPeutÊtreNull(0.1, faker.datatype.number({ min: 0, max: 100, precision: 0.01 }));
    this._dateAvancement = faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString();
    this._météo = new MétéoBuilder().build();
    this._ministèrePorteur = ministèrePorteur.nom;
    this._ministèresCoporteurs = ministèresCoPorteurs;
    this._directionAdmininstration = directionAdmininstration;
    this._chefferieDeProjet = chefferieDeProjet;
    this._coporteurs = coporteurs;
  }

  avecId(id: ProjetStructurant['id']): ProjetStructurantBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: ProjetStructurant['nom']): ProjetStructurantBuilder {
    this._nom = nom;
    return this;
  }

  avecPérimètreIds(périmètreIds: ProjetStructurant['périmètresIds']): ProjetStructurantBuilder {
    this._périmètreIds = périmètreIds;
    return this;
  }

  avecMaille(maille: ProjetStructurant['maille']): ProjetStructurantBuilder {
    this._maille = maille;
    return this;
  }

  async build(): Promise<ProjetStructurant> {
    const terrioire = await new RécupérerDétailsTerritoireUseCase().run(this._codeInsee, CODES_MAILLES[this._maille]);
    return {
      id: this._id,
      nom: this._nom,
      maille: this._maille,
      codeInsee: this._codeInsee,
      territoireNomÀAfficher: terrioire.nomAffiché,
      périmètresIds: this._périmètreIds,
      avancement: this._avancement,
      dateAvancement: this._dateAvancement,
      météo: this._météo,
      responsables: {
        ministèrePorteur: this._ministèrePorteur,
        ministèresCoporteurs: this._ministèresCoporteurs,
        directionAdmininstration: this._directionAdmininstration,
        chefferieDeProjet: this._chefferieDeProjet,
        coporteurs: this._coporteurs,
      },
    };
  }
}
