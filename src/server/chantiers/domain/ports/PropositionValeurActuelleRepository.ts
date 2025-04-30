import { PropositionValeurActuelle } from '@/server/chantiers/domain/PropositionValeurActuelle';

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

export interface PropositionValeurActuelleRepository {
  creerPropositionValeurActuelle: (propositionValeurActuelle: PropositionValeurActuelle) => Promise<void>;
  supprimerPropositionValeurActuelle: ({
    indicId,
    territoireCode,
  }: {
    indicId: string,
    territoireCode: string,
  }) => Promise<void>;
  annulePropositionValeurActuellePrecedente: ({
    indicId,
    territoireCode,
  }: {
    indicId: string,
    territoireCode: string,
  }) => Promise<void>;
  recupererLesPropositionsEnCoursParChantierIds: () => Promise<Map<string, Map<string, PropositionValeurAvancementRapport[]>>>;
  recupererLaListeDesChantiersIdsAvecPropositionEnCours: () => Promise<string[]>
}
