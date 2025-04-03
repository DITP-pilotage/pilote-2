import { Maille, MailleInterne } from '@/server/chantiers/domain/Maille';
import { TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';
import Axe from '@/server/chantiers/domain/Axe';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { Météo } from '@/server/chantiers/domain/Meteo';
import { MinistereAccueilPorteur } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import { MinisterePorteurRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

export type DirecteurAdministrationCentrale = { nom: string, direction: string };
export type DirecteurProjet = { nom: string, email: string | null };

export const typesAte = ['ate', 'hors_ate_centralise', 'hors_ate_deconcentre'] as const;
export type TypeAte = typeof typesAte[number] | null;

export const typesStatut = ['BROUILLON', 'PUBLIE', 'ARCHIVE', 'SUPPRIME'] as const;
export type TypeStatut = typeof typesStatut[number];

export interface Chantier {
  id: string;
  nom: string;
  axe: Axe['nom'];
  ppg: Ppg['nom'];
  périmètreIds: string[];
  maillesApplicables: Maille[]
  mailles: Record<Maille, TerritoiresDonnées>;
  responsables: {
    porteur: Ministère | null,
    coporteurs: Ministère[],
    directeursAdminCentrale: DirecteurAdministrationCentrale[],
    directeursProjet: DirecteurProjet[]
  }
  estBaromètre: boolean;
  estTerritorialisé: boolean;
  tauxAvancementDonnéeTerritorialisée: Record<MailleInterne, Boolean>;
  météoDonnéeTerritorialisée: Record<MailleInterne, Boolean>;
  ate: TypeAte;
  statut: TypeStatut;
  cibleAttendu: boolean;
}

export type ChantierTendance = 'BAISSE' | 'HAUSSE' | 'STAGNATION';

export type ChantierVueDEnsemble = {
  id: string
  nom: string
  avancement: number | null
  météo: Météo
  typologie: { estBaromètre: boolean, estTerritorialisé: boolean, estBrouillon: boolean }
  porteur: MinistereAccueilPorteur | MinisterePorteurRapportDetailleContrat | null
  tendance: ChantierTendance | null
  écart: number | null
  dateDeMàjDonnéesQualitatives: string | null
  dateDeMàjDonnéesQuantitatives: string | null
  maillesApplicables: Maille[]
};

export type ChantierSynthétisé = Pick<Chantier, 'id' | 'nom' | 'estTerritorialisé' | 'périmètreIds' | 'statut'> & { ate: TypeAte, territoiresApplicables: string[] };
