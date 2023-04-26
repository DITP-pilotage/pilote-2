import { ReportError, ReportTask, ReportValidata } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';

export class ReportValidataBuilder {
  private valid: boolean = true;
  
  private tasks: ReportTask[] = [];
  
  private errors: ReportError[] = [];
  
  avecValid(valid: boolean): ReportValidataBuilder {
    this.valid = valid;
    
    return this;
  }
  
  avecTasks(...tasks: ReportTask[]): ReportValidataBuilder {
    this.tasks = tasks;
    
    return this;
  }
  
  avecErrors(...errors: ReportError[]): ReportValidataBuilder {
    this.errors = errors;
    
    return this;
  }
  
  build(): ReportValidata {
    return {
      valid: this.valid,
      errors: this.errors,
      tasks: this.tasks,
    };
  }
}
