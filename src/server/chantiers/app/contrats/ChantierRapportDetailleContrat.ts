import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
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
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';


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

export interface MinistereCoporteurRapportDetailleContrat {
  nom: string
}

export interface DirecteurAdministrationCentraleRapportDetailleContrat {
  nom: string
  direction: string
}

export interface DirecteurProjetRapportDetailleContrat {
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
  cibleAttendu: boolean,
  estTerritorialisé: boolean
  estBaromètre: boolean
  axe: string
  ppg: string
  responsableLocalTerritoireSélectionné: ResponsableLocalRapportDetailleContrat[]
  coordinateurTerritorialTerritoireSélectionné: CoordinateurTerritorialRapportDetailleContrat[]
  tauxAvancementDonnéeTerritorialisée: Record<MailleInterne, Boolean>
  météoDonnéeTerritorialisée: Record<MailleInterne, Boolean>
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
    acc[val as Maille] = Object.keys(mailles[val as Maille]).reduce((accTerritoireDonnee, territoireCode) => {
      accTerritoireDonnee[territoireCode] = presenterEnTerritoireDonnéeRapportDetailleContrat(mailles[val as Maille][territoireCode]);
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
  const { maille } = territoireCodeVersMailleCodeInsee(territoireCode);
  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'regionale' : 'departementale';

  const mailles = presenterEnMailleRapportDetailleContrat(chantier.mailles);

  return {
    id: chantier.id,
    nom: chantier.nom,
    statut: chantier.statut,
    cibleAttendu: chantier.cibleAttendu,
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
        icône: chantier.responsables.porteur?.icône,
      },
      coporteurs: chantier.responsables.coporteurs.map(presenterEnMinistereCoporteurRapportDetailleContrat),
      directeursAdminCentrale: chantier.responsables.directeursAdminCentrale.map(presenterEnDirecteurAdministrationCentraleRapportDetailleContrat),
      directeursProjet: chantier.responsables.directeursProjet.map(presenterEnDirecteurProjetRapportDetailleContrat),
    },
    tauxAvancementDonnéeTerritorialisée: chantier.tauxAvancementDonnéeTerritorialisée,
    météoDonnéeTerritorialisée: chantier.météoDonnéeTerritorialisée,
    responsableLocalTerritoireSélectionné:  mailles[mailleChantier][territoireCode].responsableLocal,
    coordinateurTerritorialTerritoireSélectionné:  mailles[mailleChantier][territoireCode].coordinateurTerritorial,
    dateDeMàjDonnéesQuantitatives: mailles[mailleChantier][territoireCode].dateDeMàjDonnéesQuantitatives,
    dateDeMàjDonnéesQualitatives: mailles[mailleChantier][territoireCode].dateDeMàjDonnéesQualitatives,
    écart: mailles[mailleChantier][territoireCode].écart,
    tendance: mailles[mailleChantier][territoireCode].tendance,
    météo: mailles[mailleChantier][territoireCode].météo,
    avancementGlobal: mailles[mailleChantier][territoireCode].avancement.global,
  };
};
