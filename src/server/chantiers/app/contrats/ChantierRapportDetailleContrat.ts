import { Maille } from '@/server/domain/maille/Maille.interface';
import Chantier, {
  DirecteurAdministrationCentrale,
  DirecteurProjet,
  TypeStatut,
} from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import {
  CoordinateurTerritorial,
  ResponsableLocal,
  TerritoireDonnées,
  TerritoiresDonnées,
} from '@/server/domain/territoire/Territoire.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';


export type MailleChantierContrat = 'nationale' | 'régionale' | 'départementale';

interface TerritoireAvancementRapportDetailleContrat {
  global: number | null
  annuel: number | null
}

interface TerritoireDonnéeRapportDetailleContrat {
  estApplicable: boolean | null
  écart: number | null
  tendance: 'BAISSE' | 'HAUSSE' | 'STAGNATION' | null
  dateDeMàjDonnéesQualitatives: string | null
  dateDeMàjDonnéesQuantitatives: string | null
  avancement: TerritoireAvancementRapportDetailleContrat
  responsableLocal: ResponsableLocalRapportDetailleContrat[]
  coordinateurTerritorial: CoordinateurTerritorialRapportDetailleContrat[]
  météo: 'NON_RENSEIGNEE' | 'ORAGE' | 'NUAGE' | 'COUVERT' | 'SOLEIL' | 'NON_NECESSAIRE'
}

type ListeTerritoiresDonnéeRapportDetailleContrat = Record<string, TerritoireDonnéeRapportDetailleContrat>;

export type MailleRapportDetailleContrat = Record<Maille, ListeTerritoiresDonnéeRapportDetailleContrat>;

export interface MinisterePorteurRapportDetailleContrat {
  nom?: string
  icône?: string | null
  périmètresMinistériels: {
    id: string
  }[];
}

interface MinistereCoporteurRapportDetailleContrat {
  nom: string
}

interface DirecteurAdministrationCentraleRapportDetailleContrat {
  nom: string
  direction: string
}

interface DirecteurProjetRapportDetailleContrat {
  nom: string
  email: string | null
}

export interface ResponsableRapportDetailleContrat {
  porteur: MinisterePorteurRapportDetailleContrat | null;
  coporteurs: MinistereCoporteurRapportDetailleContrat[]
  directeursAdminCentrale: DirecteurAdministrationCentraleRapportDetailleContrat[]
  directeursProjet: DirecteurProjetRapportDetailleContrat[]
}

export interface ResponsableLocalRapportDetailleContrat {
  nom: string
  email: string
}

export interface CoordinateurTerritorialRapportDetailleContrat {
  nom: string
  email: string
}

export interface ChantierRapportDetailleContrat {
  id: string
  nom: string
  mailles: MailleRapportDetailleContrat;
  périmètreIds: string[]
  statut: TypeStatut,
  estTerritorialisé: boolean
  estBaromètre: boolean
  axe: string
  ppg: string
  responsableLocalTerritoireSélectionné: ResponsableLocalRapportDetailleContrat[]
  coordinateurTerritorialTerritoireSélectionné: CoordinateurTerritorialRapportDetailleContrat[]
  tauxAvancementDonnéeTerritorialisée: Record<'régionale' | 'départementale', Boolean>
  météoDonnéeTerritorialisée: Record<'régionale' | 'départementale', Boolean>
  responsables: ResponsableRapportDetailleContrat
  dateDeMàjDonnéesQuantitatives: string | null;
  dateDeMàjDonnéesQualitatives: string | null;
  écart: number | null;
  tendance: 'BAISSE' | 'HAUSSE' | 'STAGNATION' | null;
  météo: Météo;
  avancementGlobal: number | null;
}

const presenterEnResponsableLocalRapportDetailleContrat = (responsableLocal: ResponsableLocal): ResponsableLocalRapportDetailleContrat => {
  return {
    nom: responsableLocal.nom,
    email: responsableLocal.email,
  };
};
const presenterEnCoordinateurTerritorialRapportDetailleContrat = (coordinateursTerritorial: CoordinateurTerritorial): CoordinateurTerritorialRapportDetailleContrat => {
  return {
    nom: coordinateursTerritorial.nom,
    email: coordinateursTerritorial.email,
  };
};

const presenterEnTerritoireDonnéeRapportDetailleContrat = (territoireDonnee: TerritoireDonnées): TerritoireDonnéeRapportDetailleContrat => {
  return {
    estApplicable: territoireDonnee.estApplicable,
    écart: territoireDonnee.écart,
    tendance: territoireDonnee.tendance,
    dateDeMàjDonnéesQualitatives: territoireDonnee.dateDeMàjDonnéesQualitatives,
    dateDeMàjDonnéesQuantitatives: territoireDonnee.dateDeMàjDonnéesQuantitatives,
    responsableLocal: territoireDonnee.responsableLocal.map(presenterEnResponsableLocalRapportDetailleContrat),
    coordinateurTerritorial: territoireDonnee.coordinateurTerritorial.map(presenterEnCoordinateurTerritorialRapportDetailleContrat),
    avancement: {
      global: territoireDonnee.avancement.global,
      annuel: territoireDonnee.avancement.annuel,
    },
    météo: territoireDonnee.météo,
  };
};

// le double reduce doit être enlever, on a pas besoin d'un record, un Map<CodeInsee, TerritoireDonnee> conditionnée par la maille suffit
const presenterEnMailleRapportDetailleContrat = (mailles: Record<Maille, TerritoiresDonnées>): MailleRapportDetailleContrat => {
  return Object.keys(mailles).reduce((acc, val) => {
    acc[val as Maille] = Object.keys(mailles[val as Maille]).reduce((accTerritoireDonnee, codeInsee) => {
      accTerritoireDonnee[codeInsee] = presenterEnTerritoireDonnéeRapportDetailleContrat(mailles[val as Maille][codeInsee]);
      return accTerritoireDonnee;
    }, {} as ListeTerritoiresDonnéeRapportDetailleContrat);
    return acc;
  }, {} as MailleRapportDetailleContrat);
};

const presenterEnPerimetresMinisterielRapportDetailleContrat = (périmètreMinistériel: PérimètreMinistériel) => {
  return {
    id: périmètreMinistériel.id,
  };
};

const presenterEnMinistereCoporteurRapportDetailleContrat = (coporteur: Ministère): MinistereCoporteurRapportDetailleContrat => {
  return {
    nom: coporteur.nom,
  };
};
const presenterEnDirecteurAdministrationCentraleRapportDetailleContrat = (directeurAdminCentrale: DirecteurAdministrationCentrale): DirecteurAdministrationCentraleRapportDetailleContrat => {
  return {
    nom: directeurAdminCentrale.nom,
    direction: directeurAdminCentrale.direction,
  };
};
const presenterEnDirecteurProjetRapportDetailleContrat = (directeurProjet: DirecteurProjet): DirecteurProjetRapportDetailleContrat => {
  return {
    nom: directeurProjet.nom,
    email: directeurProjet.email,
  };
};

export const presenterEnChantierRapportDetaille = (territoireCode: string) => (chantier: Chantier): ChantierRapportDetailleContrat => {
  const [maille, codeInsee] = territoireCode.split('-');
  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';

  const mailles = presenterEnMailleRapportDetailleContrat(chantier.mailles);

  return {
    id: chantier.id,
    nom: chantier.nom,
    statut: chantier.statut,
    mailles,
    périmètreIds: chantier.périmètreIds,
    estTerritorialisé: chantier.estTerritorialisé,
    estBaromètre: chantier.estBaromètre,
    axe: chantier.axe,
    ppg: chantier.ppg,
    responsables: {
      porteur: {
        nom: chantier.responsables.porteur?.nom,
        périmètresMinistériels: (chantier.responsables.porteur?.périmètresMinistériels || []).map(presenterEnPerimetresMinisterielRapportDetailleContrat),
      },
      coporteurs: chantier.responsables.coporteurs.map(presenterEnMinistereCoporteurRapportDetailleContrat),
      directeursAdminCentrale: chantier.responsables.directeursAdminCentrale.map(presenterEnDirecteurAdministrationCentraleRapportDetailleContrat),
      directeursProjet: chantier.responsables.directeursProjet.map(presenterEnDirecteurProjetRapportDetailleContrat),
    },
    tauxAvancementDonnéeTerritorialisée: chantier.tauxAvancementDonnéeTerritorialisée,
    météoDonnéeTerritorialisée: chantier.météoDonnéeTerritorialisée,
    responsableLocalTerritoireSélectionné:  mailles[mailleChantier][codeInsee].responsableLocal,
    coordinateurTerritorialTerritoireSélectionné:  mailles[mailleChantier][codeInsee].coordinateurTerritorial,
    dateDeMàjDonnéesQuantitatives: mailles[mailleChantier][codeInsee].dateDeMàjDonnéesQuantitatives,
    dateDeMàjDonnéesQualitatives: mailles[mailleChantier][codeInsee].dateDeMàjDonnéesQualitatives,
    écart: mailles[mailleChantier][codeInsee].écart,
    tendance: mailles[mailleChantier][codeInsee].tendance,
    météo: mailles[mailleChantier][codeInsee].météo,
    avancementGlobal: mailles[mailleChantier][codeInsee].avancement.global,
  };
};
