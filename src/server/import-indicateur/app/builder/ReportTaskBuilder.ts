import { ReportErrorTask, ReportTask } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';

export class ReportTaskBuilder {
  private errors: ReportErrorTask[] = [];
  
  avecErrors(...errors: ReportErrorTask[]): ReportTaskBuilder {
    this.errors = errors;
  
    return this;
  }
  
  build(): ReportTask {
    return {
      errors: this.errors,
    };
  }
}
