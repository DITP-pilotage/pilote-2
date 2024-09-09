import Avancement from '@/server/domain/chantier/avancement/Avancement.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Indicateur from './Indicateur.interface';

export type DétailsIndicateurTerritoire = Record<CodeInsee, DétailsIndicateur>;
export type DétailsIndicateurMailles = Record<Maille, DétailsIndicateurTerritoire>;
export type DétailsIndicateurs = Record<Indicateur['id'], DétailsIndicateurTerritoire>;

interface DetailIndicateurPropositionValeurActuelle {
  valeurActuelle: number
  tauxAvancement: number | null
  tauxAvancementIntermediaire: number | null
  auteur: string | null
  dateProposition: string | null
  motif: string | null
  sourceDonneeEtMethodeCalcul: string | null
}

export type DétailsIndicateur = {
  codeInsee: string,
  valeurInitiale: number | null,
  dateValeurInitiale: string | null,
  valeurs: number[],
  dateValeurs: string[],
  valeurActuelle: number | null,
  dateValeurActuelle: string | null,
  valeurCible: number | null,
  dateValeurCible: string | null,
  valeurCibleAnnuelle: number | null,
  dateValeurCibleAnnuelle: string | null,
  avancement: Avancement,
  proposition: DetailIndicateurPropositionValeurActuelle | null,
  unité: string | null,
  est_applicable: boolean | null,
  dateImport: string | null,
  pondération: number | null,
  prochaineDateValeurActuelle: string | null,
  prochaineDateMaj: string | null,
  prochaineDateMajJours: number | null,
  estAJour: boolean | null,
  tendance: string | null,
};
