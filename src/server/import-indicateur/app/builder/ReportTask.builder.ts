import { ReportErrorTask, ReportResourceTask, ReportResourceTaskData, ReportTask } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';

export class ReportResourceTaskBuilder {
  private data: ReportResourceTaskData = [];

  avecData(data: ReportResourceTaskData) {
    this.data = data;

    return this;
  }

  build(): ReportResourceTask {
    return {
      data: this.data,
    };
  }
}

export class ReportTaskBuilder {
  private errors: ReportErrorTask[] = [];

  private resource: ReportResourceTask = new ReportResourceTaskBuilder().build();
  
  avecErrors(...errors: ReportErrorTask[]): ReportTaskBuilder {
    this.errors = errors;
  
    return this;
  }

  avecResource(resource: ReportResourceTask): ReportTaskBuilder {
    this.resource = resource;
  
    return this;
  }
  
  build(): ReportTask {
    return {
      errors: this.errors,
      resource: this.resource,
    };
  }
}
