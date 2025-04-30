export interface PropositionValeurActuelleRepository {
  modifierStatutPropositionsValeurActuelleApresImport: ({ 
    indicId,
    zoneId,
    dateValeurImportee,
    valeurImportee,
  }: {
    indicId: string,
    zoneId: string,
    dateValeurImportee: Date
    valeurImportee: number
  }) => Promise<void>;
}
