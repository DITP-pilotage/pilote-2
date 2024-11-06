import { PropositionValeurActuelle } from '@/server/chantiers/domain/PropositionValeurActuelle';

export interface PropositionValeurActuelleRepository {
  creerPropositionValeurActuelle: (propositionValeurActuelle: PropositionValeurActuelle) => Promise<void>;
  supprimerPropositionValeurActuelle: ({
    indicId,
    territoireCode,
  }: {
    indicId: string,
    territoireCode: string,
  }) => Promise<void>;
}
