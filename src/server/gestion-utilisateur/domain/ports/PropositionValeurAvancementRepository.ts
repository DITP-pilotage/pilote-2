export interface PropositionValeurAvancementRepository {
  anonymiserAuteurs(listeIds: string[], emailAuteurRemplacement: string): Promise<void>;
}
