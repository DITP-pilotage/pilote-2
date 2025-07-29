export interface PropositionValeurAvancementRepository {
  modifierStatutPropositionsValeurAvancementApresImport: ({
    indicId,
    zoneId,
    dateValeurImportee,
    valeurImportee,
  }: {
    indicId: string;
    zoneId: string;
    dateValeurImportee: Date;
    valeurImportee: number;
  }) => Promise<void>;
}
