import { chantier } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import {
  générerCaractèresSpéciaux, générerPeutÊtreNull,
  générerTableau,
  générerUneMailleAléatoire, générerUnLibellé,
  retourneUneListeDeCodeInseeCohérentePourUneMaille,
} from '@/server/infrastructure/test/builders/utils';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';
import AvancementBuilder from '@/server/domain/chantier/avancement/Avancement.builder';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import MinistèreBuilder from '@/server/domain/ministère/Ministère.builder';
import { TypeAte, typesAte, typesStatut } from '@/server/domain/chantier/Chantier.interface';

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

  private _tauxAvancementPrécédent: chantier['taux_avancement_precedent'];

  private _tauxAvancementAnnuel: chantier['taux_avancement_annuel'];

  private _ministères: chantier['ministeres'];

  private _ministères_acronymes: chantier['ministeres_acronymes'];

  private _météo: chantier['meteo'];

  private _directeursAdminCentrale: chantier['directeurs_administration_centrale'];

  private _directionsAdminCentrale: chantier['directions_administration_centrale'];

  private _directeursProjet: chantier['directeurs_projet'];

  private _directeursProjetMails: chantier['directeurs_projet_mails'];

  private _responsables_locaux: chantier['responsables_locaux'];

  private _responsables_locaux_mails: chantier['responsables_locaux_mails'];

  private _coordinateurs_territoriaux: chantier['coordinateurs_territoriaux'];

  private _coordinateurs_territoriaux_mails: chantier['coordinateurs_territoriaux_mails'];

  private _estBaromètre: chantier['est_barometre'];

  private _estTerritorialisé: chantier['est_territorialise'];

  private _territoireCode: chantier['territoire_code'];

  private _ate: chantier['ate'];

  private _a_meteo_departemental: chantier['a_meteo_departemental'];

  private _a_meteo_regional: chantier['a_meteo_regional'];

  private _a_taux_avancement_departemental: chantier['a_taux_avancement_departemental'];

  private _a_taux_avancement_regional: chantier['a_taux_avancement_regional'];

  private _a_supprimer: chantier['a_supprimer'];

  private _est_applicable: chantier['est_applicable'];

  private _statut: chantier['statut'];

  private _taux_avancement_date: chantier['taux_avancement_date'];

  constructor() {
    const chantierGénéré = new ChantierBuilder().build();
    const avancement = new AvancementBuilder().build();
    const avancementPrécédent = faker.helpers.arrayElement([avancement, new AvancementBuilder().build()]);
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
    this._territoireNom = générerPeutÊtreNull(0.2, faker.address.state());
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    this._tauxAvancement = avancement.global;
    this._tauxAvancementAnnuel = avancement.annuel;
    this._tauxAvancementPrécédent = avancementPrécédent.global;
    this._ministères = ministères.map(ministère => ministère.id);
    this._ministères_acronymes = ministères.map(ministère => ministère.acronyme);
    this._météo = générerPeutÊtreNull(0.05, météo);
    this._directeursAdminCentrale = chantierGénéré.responsables.directeursAdminCentrale.map(directeur => directeur.nom);
    this._directionsAdminCentrale = chantierGénéré.responsables.directeursAdminCentrale.map(directeur => directeur.direction);
    this._directeursProjet = chantierGénéré.responsables.directeursProjet.map(directeur => directeur.nom);
    this._directeursProjetMails = chantierGénéré.responsables.directeursProjet.map(directeur => directeur.email ?? 'example@example.te');
    this._responsables_locaux = générerTableau(1, 3, () => (faker.name.fullName()));
    this._responsables_locaux_mails = générerTableau(1, 3, () => (faker.internet.email()));
    this._coordinateurs_territoriaux = générerTableau(1, 3, () => (faker.name.fullName()));
    this._coordinateurs_territoriaux_mails = générerTableau(1, 3, () => (faker.internet.email()));
    this._estBaromètre = générerPeutÊtreNull(0.2, chantierGénéré.estBaromètre);
    this._estTerritorialisé = générerPeutÊtreNull(0.2, chantierGénéré.estTerritorialisé);
    this._territoireCode = `${this._maille}-${this._codeInsee}`;
    this._ate = faker.helpers.arrayElement(typesAte);
    this._statut = faker.helpers.arrayElement(typesStatut);
    this._a_meteo_departemental = faker.datatype.boolean();
    this._a_meteo_regional = faker.datatype.boolean();
    this._a_taux_avancement_departemental = faker.datatype.boolean();
    this._a_taux_avancement_regional = faker.datatype.boolean();
    this._est_applicable = faker.datatype.boolean();
    this._a_supprimer = false;
    this._taux_avancement_date = faker.datatype.datetime().toISOString();
  }

  avecId(id: chantier['id']): ChantierRowBuilder {
    this._id = id;
    this._nom = `${générerUnLibellé(6, 14)} ${générerCaractèresSpéciaux(3)} ${this._id}`;
    return this;
  }

  avecNom(nom: chantier['nom']): ChantierRowBuilder {
    this._nom = nom;
    return this;
  }

  avecAxe(axe: chantier['axe']): ChantierRowBuilder {
    this._axe = axe;
    return this;
  }

  avecPpg(ppg: chantier['ppg']): ChantierRowBuilder {
    this._ppg = ppg;
    return this;
  }

  avecPérimètreIds(périmètreIds: chantier['perimetre_ids']): ChantierRowBuilder {
    this._périmètreIds = périmètreIds;
    return this;
  }

  avecMaille(maille: chantier['maille']): ChantierRowBuilder {
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);
    
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    this._territoireCode = `${this._maille}-${this._codeInsee}`;
    return this;
  }

  avecTerritoireNom(territoireNom: chantier['territoire_nom']): ChantierRowBuilder {
    this._territoireNom = territoireNom;
    return this;
  }

  avecCodeInsee(codeInsee: chantier['code_insee']): ChantierRowBuilder {
    this._codeInsee = codeInsee;
    this._territoireCode = `${this._maille}-${this._codeInsee}`;
    return this;
  }

  avecTauxAvancement(tauxAvancement: chantier['taux_avancement']): ChantierRowBuilder {
    this._tauxAvancement = tauxAvancement;
    return this;
  }

  avecTauxAvancementPrécédent(tauxAvancementPrécédent: chantier['taux_avancement_precedent']): ChantierRowBuilder {
    this._tauxAvancementPrécédent = tauxAvancementPrécédent;
    return this;
  }

  avecTauxAvancementAnnuel(tauxAvancementAnnuel: chantier['taux_avancement_annuel']): ChantierRowBuilder {
    this._tauxAvancementAnnuel = tauxAvancementAnnuel;
    return this;
  }

  avecMinistères(ministères: chantier['ministeres']): ChantierRowBuilder {
    this._ministères = ministères;
    return this;
  }

  avecMinistèresAcronyme(acronyme: chantier['ministeres_acronymes']): ChantierRowBuilder {
    this._ministères_acronymes = acronyme;
    return this;
  }

  avecMétéo(météo: chantier['meteo']): ChantierRowBuilder {
    this._météo = météo;
    return this;
  }

  avecDirecteursAdminCentrale(directeursAdminCentrale: chantier['directeurs_administration_centrale']): ChantierRowBuilder {
    this._directeursAdminCentrale = directeursAdminCentrale;
    return this;
  }

  avecDirectionsAdminCentrale(directionsAdminCentrale: chantier['directions_administration_centrale']): ChantierRowBuilder {
    this._directionsAdminCentrale = directionsAdminCentrale;
    return this;
  }

  avecDirecteursProjet(directeursProjet: chantier['directeurs_projet']): ChantierRowBuilder {
    this._directeursProjet = directeursProjet;
    return this;
  }

  avecDirecteursProjetMails(directeursProjetMails: chantier['directeurs_projet_mails']): ChantierRowBuilder {
    this._directeursProjetMails = directeursProjetMails;
    return this;
  }

  avecEstBaromètre(estBaromètre: chantier['est_barometre']): ChantierRowBuilder {
    this._estBaromètre = estBaromètre;
    return this;
  }

  avecEstTerritorialisé(estTerritorialisé: chantier['est_territorialise']): ChantierRowBuilder {
    this._estTerritorialisé = estTerritorialisé;
    return this;
  }

  avecAte(typeAte: TypeAte): ChantierRowBuilder {
    this._ate = typeAte;
    return this;
  }

  avecAMeteoDepartemental(aMeteo: chantier['a_meteo_departemental']): ChantierRowBuilder {
    this._a_meteo_departemental = aMeteo;
    return this;
  }

  avecAMeteoRegional(aMeteo: chantier['a_meteo_regional']): ChantierRowBuilder {
    this._a_meteo_regional = aMeteo;
    return this;
  }

  avecTauxAvancementDepartemental(aTauxAvancement: chantier['a_taux_avancement_departemental']): ChantierRowBuilder {
    this._a_taux_avancement_departemental = aTauxAvancement;
    return this;
  }

  avecTauxAvancementRegional(aTauxAvancement: chantier['a_taux_avancement_regional']): ChantierRowBuilder {
    this._a_taux_avancement_regional = aTauxAvancement;
    return this;
  }

  avecEstApplicable(est_applicable: chantier['est_applicable']): ChantierRowBuilder {
    this._est_applicable = est_applicable;
    return this;
  }

  avecStatut(statut: chantier['statut']): ChantierRowBuilder {
    this._statut = statut;
    return this;
  }

  avecTauxAvancementDate(taux_avancement_date: chantier['taux_avancement_date']): ChantierRowBuilder {
    this._taux_avancement_date = taux_avancement_date;
    return this;
  }

  shallowCopy(): ChantierRowBuilder {
    const result = new ChantierRowBuilder() as any;
    for (const attribut in this) {
      result[attribut] = this[attribut];
    }
    return result as ChantierRowBuilder;
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
      taux_avancement_precedent: this._tauxAvancementPrécédent,
      taux_avancement_annuel: this._tauxAvancementAnnuel,
      ministeres: this._ministères,
      ministeres_acronymes: this._ministères_acronymes,
      meteo: this._météo,
      directeurs_administration_centrale: this._directeursAdminCentrale,
      directions_administration_centrale: this._directionsAdminCentrale,
      directeurs_projet: this._directeursProjet,
      directeurs_projet_mails: this._directeursProjetMails,
      responsables_locaux: this._responsables_locaux,
      responsables_locaux_mails: this._responsables_locaux_mails,
      coordinateurs_territoriaux: this._coordinateurs_territoriaux,
      coordinateurs_territoriaux_mails: this._coordinateurs_territoriaux_mails,
      est_barometre: this._estBaromètre,
      est_territorialise: this._estTerritorialisé,
      territoire_code: this._territoireCode,
      ate: this._ate,
      a_meteo_departemental: this._a_meteo_departemental,
      a_meteo_regional: this._a_meteo_regional,
      a_taux_avancement_departemental: this._a_taux_avancement_departemental,
      a_taux_avancement_regional: this._a_taux_avancement_regional,
      a_supprimer: this._a_supprimer,
      est_applicable: this._est_applicable,
      statut: this._statut,
      taux_avancement_date: this._taux_avancement_date,
    };
  }
}
