export interface MbSyncExecutionRepository {
  recupererDerniereDateSync(): Promise<Date>;
  mettreAJourDerniereDateSync(date: Date): Promise<void>;
}
