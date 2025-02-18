export interface PropositionValeurActuelleRepository {
  supprimerPropositionsValeurActuelleApresImport: ({ 
    indicId,
    zoneId,
    dateValeurImportee,
  }: {
    indicId: string,
    zoneId: string,
    dateValeurImportee: Date
  }) => Promise<void>;
}
