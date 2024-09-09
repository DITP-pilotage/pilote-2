import { PropositionValeurActuelle } from '@/server/chantiers/domain/PropositionValeurActuelle';

export interface PropositionValeurActuelleRepository {
  creerPropositionValeurActuelle: (propositionValeurActuelle: PropositionValeurActuelle) => Promise<void>;
}
