import { PropositionValeurAvancement } from '@/server/chantiers/domain/PropositionValeurAvancement';

export type PropositionValeurAvancementRapport = {
  indicateurId: string
  territoireCode: string
  dateValeurAvancement: string
  valeurAvancementProposee: string
  valeurAvancementReference: string
  nomIndicateur: string
  uniteIndicateur: string
  nomTerritoire: string
};

export interface PropositionValeurAvancementRepository {
  creerPropositionValeurAvancement: (propositionValeurAvancement: PropositionValeurAvancement) => Promise<void>;
  supprimerPropositionValeurAvancement: ({
    indicId,
    territoireCode,
  }: {
    indicId: string,
    territoireCode: string,
  }) => Promise<void>;
  annulePropositionValeurAvancementPrecedente: ({
    indicId,
    territoireCode,
  }: {
    indicId: string,
    territoireCode: string,
  }) => Promise<void>;
  recupererLesPropositionsEnCoursParChantierIds: () => Promise<Map<string, Map<string, PropositionValeurAvancementRapport[]>>>;
  recupererLaListeDesChantiersIdsAvecPropositionEnCours: () => Promise<string[]>
}
