export interface ApplicationLogRepository {
  purger(anterieurA: Date): Promise<number>;
}
