import { chantier } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { générerUneMailleAléatoire, retourneUneListeDeCodeInseeCohérentePourUneMaille } from '@/server/infrastructure/test/builders/utils';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';
import AvancementBuilder from '@/server/domain/avancement/Avancement.builder';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import MinistèreBuilder from '@/server/domain/ministère/Ministère.builder';

export default class ChantierRowBuilder {
  private _id: chantier['id'];

  private _nom: chantier['nom'];

  private _axe: chantier['axe'];

  private _ppg: chantier['ppg'];

  private _périmètreIds: chantier['perimetre_ids'];

  private _maille: chantier['maille'];

  private _territoireNom: chantier['territoire_nom'];

  private _codeInsee: chantier['code_insee'];

  private _tauxAvancement: chantier['taux_avancement'];

  private _ministères: chantier['ministeres'];

  private _météo: chantier['meteo'];

  private _directeursAdminCentrale: chantier['directeurs_administration_centrale'];

  private _directionsAdminCentrale: chantier['directions_administration_centrale'];

  private _directeursProjet: chantier['directeurs_projet'];

  private _directeursProjetMails: chantier['directeurs_projet_mails'];

  private _estBaromètre: chantier['est_barometre'];

  private _estTerritorialisé: chantier['est_territorialise'];

  constructor() {
    const chantierGénéré = new ChantierBuilder().build();
    const avancement = new AvancementBuilder().build();
    const météo = new MétéoBuilder().build();
    const ministères = faker.helpers.arrayElement([[new MinistèreBuilder().build()], [new MinistèreBuilder().build(), new MinistèreBuilder().build()]]);

    const maille = générerUneMailleAléatoire();
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);
      
    this._id = chantierGénéré.id;
    this._nom = chantierGénéré.nom;
    this._axe = chantierGénéré.axe;
    this._ppg = chantierGénéré.ppg;
    this._périmètreIds = ministères.flatMap(ministère => ministère.périmètresMinistériels).map(périmètreMinistériel => périmètreMinistériel.id);
    this._maille = maille;
    this._territoireNom = faker.helpers.arrayElement([null, faker.address.state()]);
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    this._tauxAvancement = avancement.global;
    this._ministères = ministères.map(ministère => ministère.nom);
    this._météo = faker.helpers.arrayElement([null, météo]);
    this._directeursAdminCentrale = chantierGénéré.responsables.directeursAdminCentrale.map(directeur => directeur.nom);
    this._directionsAdminCentrale = chantierGénéré.responsables.directeursAdminCentrale.map(directeur => directeur.direction);
    this._directeursProjet = chantierGénéré.responsables.directeursProjet.map(directeur => directeur.nom);
    this._directeursProjetMails = chantierGénéré.responsables.directeursProjet.map(directeur => directeur.email ?? 'example@example.te');
    this._estBaromètre = faker.helpers.arrayElement([null, chantierGénéré.estBaromètre]);
    this._estTerritorialisé = faker.helpers.arrayElement([null, chantierGénéré.estTerritorialisé]);
  }

  avecId(id: typeof this._id): ChantierRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: typeof this._nom): ChantierRowBuilder {
    this._nom = nom;
    return this;
  }

  avecAxe(axe: typeof this._axe): ChantierRowBuilder {
    this._axe = axe;
    return this;
  }

  avecPpg(ppg: typeof this._ppg): ChantierRowBuilder {
    this._ppg = ppg;
    return this;
  }

  avecPérimètreIds(périmètreIds: typeof this._périmètreIds): ChantierRowBuilder {
    this._périmètreIds = périmètreIds;
    return this;
  }

  avecMaille(maille: typeof this._maille): ChantierRowBuilder {
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);
    
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    return this;
  }

  avecTerritoireNomNom(territoireNom: typeof this._territoireNom): ChantierRowBuilder {
    this._territoireNom = territoireNom;
    return this;
  }

  avecCodeInsee(codeInsee: typeof this._codeInsee): ChantierRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecTauxAvancement(tauxAvancement: typeof this._tauxAvancement): ChantierRowBuilder {
    this._tauxAvancement = tauxAvancement;
    return this;
  }

  avecMinistères(ministères: typeof this._ministères): ChantierRowBuilder {
    this._ministères = ministères;
    return this;
  }

  avecMétéo(météo: typeof this._météo): ChantierRowBuilder {
    this._météo = météo;
    return this;
  }

  avecDirecteursAdminCentrale(directeursAdminCentrale: typeof this._directeursAdminCentrale): ChantierRowBuilder {
    this._directeursAdminCentrale = directeursAdminCentrale;
    return this;
  }

  avecDirectionsAdminCentrale(directionsAdminCentrale: typeof this._directionsAdminCentrale): ChantierRowBuilder {
    this._directionsAdminCentrale = directionsAdminCentrale;
    return this;
  }

  avecDirecteursProjet(directeursProjet: typeof this._directeursProjet): ChantierRowBuilder {
    this._directeursProjet = directeursProjet;
    return this;
  }

  avecDirecteursProjetMails(directeursProjetMails: typeof this._directeursProjetMails): ChantierRowBuilder {
    this._directeursProjetMails = directeursProjetMails;
    return this;
  }

  avecEstBaromètre(estBaromètre: typeof this._estBaromètre): ChantierRowBuilder {
    this._estBaromètre = estBaromètre;
    return this;
  }

  avecEstTerritorialisé(estTerritorialisé: typeof this._estTerritorialisé): ChantierRowBuilder {
    this._estTerritorialisé = estTerritorialisé;
    return this;
  }

  build(): chantier {
    return {
      id: this._id,
      nom: this._nom,
      axe: this._axe,
      ppg: this._ppg,
      perimetre_ids: this._périmètreIds,
      maille: this._maille,
      territoire_nom: this._territoireNom,
      code_insee: this._codeInsee,
      taux_avancement: this._tauxAvancement,
      ministeres: this._ministères,
      meteo: this._météo,
      directeurs_administration_centrale: this._directeursAdminCentrale,
      directions_administration_centrale: this._directionsAdminCentrale,
      directeurs_projet: this._directeursProjet,
      directeurs_projet_mails: this._directeursProjetMails,
      est_barometre: this._estBaromètre,
      est_territorialise: this._estTerritorialisé,
    };
  }
}
