import Chantier, { TypeStatut } from '@/server/domain/chantier/Chantier.interface';
import { TerritoireDonnées, TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';

interface TerritoireAvancementAccueilContrat {
  global: number | null
  annuel: number | null
}

interface TerritoireDonnéeAccueilContrat {
  estApplicable: boolean | null
  écart: number | null
  tendance: 'BAISSE' | 'HAUSSE' | 'STAGNATION' | null
  dateDeMàjDonnéesQualitatives: string | null
  dateDeMàjDonnéesQuantitatives: string | null
  avancement: TerritoireAvancementAccueilContrat
  météo: 'NON_RENSEIGNEE' | 'ORAGE' | 'NUAGE' | 'COUVERT' | 'SOLEIL' | 'NON_NECESSAIRE'
}

export type ListeTerritoiresDonnéeAccueilContrat = Record<string, TerritoireDonnéeAccueilContrat>;

export type MailleChantierContrat = 'nationale' | 'regionale' | 'departementale';


type MailleAccueilContrat = Record<MailleChantierContrat, ListeTerritoiresDonnéeAccueilContrat>;

export interface MinistereAccueilPorteur {
  nom?: string
  icône?: string | null
  périmètresMinistériels: {
    id: string
  }[];
}

export interface ChantierAccueilContrat {
  id: string
  nom: string
  statut: TypeStatut,
  cibleAttendu: boolean,
  mailles: MailleAccueilContrat;
  périmètreIds: string[]
  estTerritorialisé: boolean
  estBaromètre: boolean
  axe: string
  ppg: string
  tauxAvancementDonnéeTerritorialisée: Record<'regionale' | 'departementale', Boolean>
  météoDonnéeTerritorialisée: Record<'regionale' | 'departementale', Boolean>
  responsables: {
    porteur: MinistereAccueilPorteur | null
  }
  dateDeMàjDonnéesQuantitatives: string | null;
  dateDeMàjDonnéesQualitatives: string | null;
  écart: number | null;
  tendance: 'BAISSE' | 'HAUSSE' | 'STAGNATION' | null;
  météo: Météo;
  avancementGlobal: number | null;
}

const presenterEnTerritoireDonnéeAccueilContrat = (territoireDonnee: TerritoireDonnées): TerritoireDonnéeAccueilContrat => {
  return {
    estApplicable: territoireDonnee.estApplicable,
    écart: territoireDonnee.écart,
    tendance: territoireDonnee.tendance,
    dateDeMàjDonnéesQualitatives: territoireDonnee.dateDeMàjDonnéesQualitatives,
    dateDeMàjDonnéesQuantitatives: territoireDonnee.dateDeMàjDonnéesQuantitatives,
    avancement: {
      global: territoireDonnee.avancement.global,
      annuel: territoireDonnee.avancement.annuel,
    },
    météo: territoireDonnee.météo,
  };
};

// le double reduce doit être enlever, on a pas besoin d'un record, un Map<CodeInsee, TerritoireDonnee> conditionnée par la maille suffit
const presenterEnMailleAccueilContrat = (mailles: Record<MailleChantierContrat, TerritoiresDonnées>): MailleAccueilContrat => {
  return Object.keys(mailles).reduce((acc, val) => {
    acc[val as MailleChantierContrat] = Object.keys(mailles[val as MailleChantierContrat]).reduce((accTerritoireDonnee, territoireCode) => {
      accTerritoireDonnee[territoireCode] = presenterEnTerritoireDonnéeAccueilContrat(mailles[val as MailleChantierContrat][territoireCode]);
      return accTerritoireDonnee;
    }, {} as ListeTerritoiresDonnéeAccueilContrat);
    return acc;
  }, {} as MailleAccueilContrat);
};

const presenterEnPerimetresMinisterielAccueilContrat = (périmètreMinistériel: PérimètreMinistériel) => {
  return {
    id: périmètreMinistériel.id,
  };
};

export const presenterEnChantierAccueilContrat = (territoireCode: string) => (chantier: Chantier): ChantierAccueilContrat => {
  const { maille } = territoireCodeVersMailleCodeInsee(territoireCode);
  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'regionale' : 'departementale';

  const mailles = presenterEnMailleAccueilContrat(chantier.mailles);

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
        icône: chantier.responsables.porteur?.icône,
        périmètresMinistériels: (chantier.responsables.porteur?.périmètresMinistériels || []).map(presenterEnPerimetresMinisterielAccueilContrat),
      },
    },
    tauxAvancementDonnéeTerritorialisée: chantier.tauxAvancementDonnéeTerritorialisée,
    météoDonnéeTerritorialisée: chantier.météoDonnéeTerritorialisée,
    dateDeMàjDonnéesQuantitatives: mailles[mailleChantier][territoireCode].dateDeMàjDonnéesQuantitatives,
    dateDeMàjDonnéesQualitatives: mailles[mailleChantier][territoireCode].dateDeMàjDonnéesQualitatives,
    écart: mailles[mailleChantier][territoireCode].écart,
    tendance: mailles[mailleChantier][territoireCode].tendance,
    météo: mailles[mailleChantier][territoireCode].météo,
    avancementGlobal: mailles[mailleChantier][territoireCode].avancement.global,
  };
};
