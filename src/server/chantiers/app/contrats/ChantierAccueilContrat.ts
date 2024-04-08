import Chantier, { TypeStatut } from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { TerritoireDonnées, TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

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

type ListeTerritoiresDonnéeAccueilContrat = Record<string, TerritoireDonnéeAccueilContrat>;

type MailleAccueilContrat = Record<Maille, ListeTerritoiresDonnéeAccueilContrat>;

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
  mailles: MailleAccueilContrat;
  périmètreIds: string[]
  estTerritorialisé: boolean
  estBaromètre: boolean
  axe: string
  ppg: string
  tauxAvancementDonnéeTerritorialisée: Record<'régionale' | 'départementale', Boolean>
  météoDonnéeTerritorialisée: Record<'régionale' | 'départementale', Boolean>
  responsables: {
    porteur: MinistereAccueilPorteur | null
  }
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
const presenterEnMailleAccueilContrat = (mailles: Record<Maille, TerritoiresDonnées>): MailleAccueilContrat => {
  return Object.keys(mailles).reduce((acc, val) => {
    acc[val as Maille] = Object.keys(mailles[val as Maille]).reduce((accTerritoireDonnee, codeInsee) => {
      accTerritoireDonnee[codeInsee] = presenterEnTerritoireDonnéeAccueilContrat(mailles[val as Maille][codeInsee]);
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

export const presenterEnChantierAccueilContrat = (chantier: Chantier): ChantierAccueilContrat => {
  return {
    id: chantier.id,
    nom: chantier.nom,
    statut: chantier.statut,
    mailles: presenterEnMailleAccueilContrat(chantier.mailles),
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
  };
};
