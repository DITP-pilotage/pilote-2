import { faker } from '@faker-js/faker/locale/fr';
import Chantier, { typesStatut } from '@/server/domain/chantier/Chantier.interface';
import { CodeInsee, codeInseeFrance, codesInseeDépartements, codesInseeRégions, TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';
import {
  générerCaractèresSpéciaux, générerTableau,
  générerUnIdentifiantUnique,
  générerUnLibellé,
} from '@/server/infrastructure/test/builders/utils';
import PpgBuilder from '@/server/domain/ppg/Ppg.builder';
import MinistèreBuilder from '@/server/domain/ministère/Ministère.builder';
import TerritoireDonnéesBuilder from '@/server/domain/territoire/TerritoireDonnées.builder';
import AxeBuilder from '@/server/domain/axe/Axe.builder';

const ÉCHANTILLON_DIRECTIONS = ['SESVAS', 'DGASD', 'DG2TCC', 'DGFPAZ', 'DGRAOP', 'MINAFESD', 'SGFET', 'SGPECM', 'SGNGF'];

export default class ChantierBuilder {
  private _id: Chantier['id'];

  private _nom: Chantier['nom'];

  private _axe: Chantier['axe'];

  private _ppg: Chantier['ppg'];

  private _périmètreIds: Chantier['périmètreIds'];

  private _mailles: Chantier['mailles'];

  private _porteur: Chantier['responsables']['porteur'];

  private _coporteurs: Chantier['responsables']['coporteurs'];

  private _directeursAdminCentrale: Chantier['responsables']['directeursAdminCentrale'];

  private _directeursProjet: Chantier['responsables']['directeursProjet'];

  private _estBaromètre: Chantier['estBaromètre'];

  private _estTerritorialisé: Chantier['estTerritorialisé'];

  private _tauxAvancementDonnéeTerritorialisée: Chantier['tauxAvancementDonnéeTerritorialisée'];

  private _météoDonnéeTerritorialisée: Chantier['météoDonnéeTerritorialisée'];

  private _ate: Chantier['ate'];

  private _statut: Chantier['statut'];

  constructor() {
    const axe = new AxeBuilder().build();
    const ppg = new PpgBuilder().build();
    const ministèrePorteur = new MinistèreBuilder().build();
    const ministèresCoPorteurs = générerTableau(0, 3, () => new MinistèreBuilder().build());
    const directeursAdminCentrale = générerTableau(1, 2, () => ({ nom: faker.name.fullName(), direction: faker.helpers.arrayElement(ÉCHANTILLON_DIRECTIONS) }));
    const directeursProjet = générerTableau(1, 3, () => ({ nom: faker.name.fullName(), email: faker.internet.email() }));

    this._id = générerUnIdentifiantUnique('CH');
    this._nom = `${générerUnLibellé(6, 14)} ${générerCaractèresSpéciaux(3)} ${this._id}`;
    this._axe = axe.nom;
    this._ppg = ppg.nom;
    this._ate = null;
    this._statut = faker.helpers.arrayElement(typesStatut);
    this._périmètreIds = ministèrePorteur.périmètresMinistériels.map(périmètreMinistériel => périmètreMinistériel.id);
    this._mailles = {
      nationale: this._générerTerritoires([codeInseeFrance]),
      régionale: this._générerTerritoires(codesInseeRégions),
      départementale: this._générerTerritoires(codesInseeDépartements),
    };
    this._porteur = ministèrePorteur;
    this._coporteurs = ministèresCoPorteurs;
    this._directeursAdminCentrale = directeursAdminCentrale;
    this._directeursProjet = directeursProjet;
    this._estBaromètre = faker.datatype.boolean();
    this._estTerritorialisé = faker.datatype.boolean();
    this._tauxAvancementDonnéeTerritorialisée = {
      'départementale': faker.datatype.boolean(),
      'régionale': faker.datatype.boolean(),
    };
    this._météoDonnéeTerritorialisée = {
      'départementale': faker.datatype.boolean(),
      'régionale': faker.datatype.boolean(),
    };
  }

  private _générerTerritoires(codesInsee: readonly CodeInsee[]) {
    const territoires: TerritoiresDonnées = {};
    codesInsee.forEach(codeInsee => territoires[codeInsee] = new TerritoireDonnéesBuilder().avecCodeInsee(codeInsee).build());
    return territoires;
  }

  avecId(id: Chantier['id']): ChantierBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: Chantier['nom']): ChantierBuilder {
    this._nom = nom;
    return this;
  }

  avecAxe(axe: Chantier['axe']): ChantierBuilder {
    this._axe = axe;
    return this;
  }

  avecPpg(ppg: Chantier['ppg']): ChantierBuilder {
    this._ppg = ppg;
    return this;
  }

  avecPérimètreIds(périmètreIds: Chantier['périmètreIds']): ChantierBuilder {
    this._périmètreIds = périmètreIds;
    return this;
  }

  avecMailleRégionale(mailleRégionale: Chantier['mailles']['régionale']): ChantierBuilder {
    this._mailles.régionale = mailleRégionale;
    return this;
  }

  avecMailleDépartementale(mailleDépartementale: Chantier['mailles']['départementale']): ChantierBuilder {
    this._mailles.départementale = mailleDépartementale;
    return this;
  }

  avecMailleNationale(mailleNationale: Chantier['mailles']['nationale']): ChantierBuilder {
    this._mailles.nationale = mailleNationale;
    return this;
  }

  avecPorteur(porteur: Chantier['responsables']['porteur']): ChantierBuilder {
    this._porteur = porteur;
    return this;
  }

  avecCoporteurs(coporteurs: Chantier['responsables']['coporteurs']): ChantierBuilder {
    this._coporteurs = coporteurs;
    return this;
  }

  avecDirecteursAdminCentrale(directeursAdminCentrale: Chantier['responsables']['directeursAdminCentrale']): ChantierBuilder {
    this._directeursAdminCentrale = directeursAdminCentrale;
    return this;
  }

  avecDirecteursProjet(directeursProjet: Chantier['responsables']['directeursProjet']): ChantierBuilder {
    this._directeursProjet = directeursProjet;
    return this;
  }

  avecEstBaromètre(estBaromètre: Chantier['estBaromètre']): ChantierBuilder {
    this._estBaromètre = estBaromètre;
    return this;
  }

  avecEstTerritorialisé(estTerritorialisé: Chantier['estTerritorialisé']): ChantierBuilder {
    this._estTerritorialisé = estTerritorialisé;
    return this;
  }

  avecTauxAvancementDonnéeTerritorialisée(tauxAvancementDonnéeTerritorialisée: Chantier['tauxAvancementDonnéeTerritorialisée']): ChantierBuilder {
    this._tauxAvancementDonnéeTerritorialisée = tauxAvancementDonnéeTerritorialisée;
    return this;
  }

  avecMétéoDonnéeTerritorialisée(météoDonnéeTerritorialisée: Chantier['météoDonnéeTerritorialisée']): ChantierBuilder {
    this._météoDonnéeTerritorialisée = météoDonnéeTerritorialisée;
    return this;
  }

  avecSatut(statut: Chantier['statut']): ChantierBuilder {
    this._statut = statut;
    return this;
  }

  build(): Chantier {
    return {
      id: this._id,
      nom: this._nom,
      axe: this._axe,
      ppg: this._ppg,
      périmètreIds: this._périmètreIds,
      ate: this._ate,
      statut: this._statut,
      mailles: this._mailles,
      responsables: {
        porteur: this._porteur,
        coporteurs: this._coporteurs,
        directeursAdminCentrale: this._directeursAdminCentrale,
        directeursProjet: this._directeursProjet,
      },
      estBaromètre: this._estBaromètre,
      estTerritorialisé: this._estTerritorialisé,
      tauxAvancementDonnéeTerritorialisée: this._tauxAvancementDonnéeTerritorialisée,
      météoDonnéeTerritorialisée: this._météoDonnéeTerritorialisée,
    };
  }
}
