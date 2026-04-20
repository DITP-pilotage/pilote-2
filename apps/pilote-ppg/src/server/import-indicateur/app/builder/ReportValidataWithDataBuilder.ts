import {
  ReportErrorTask,
  ReportResourceData,
  ReportValidataWithData,
} from "@/server/import-indicateur/infrastructure/ReportValidata.interface";

export class ReportValidataWithDataBuilder {
  private valid: boolean = true;

  private errors: ReportErrorTask[] = [];

  private resourceData: ReportResourceData = [];

  avecValid(valid: boolean): ReportValidataWithDataBuilder {
    this.valid = valid;

    return this;
  }

  avecResourceData(
    ...resourceData: ReportResourceData
  ): ReportValidataWithDataBuilder {
    this.resourceData = resourceData;

    return this;
  }

  avecErrors(...errors: ReportErrorTask[]): ReportValidataWithDataBuilder {
    this.errors = errors;

    return this;
  }

  build(): ReportValidataWithData {
    return {
      valid: this.valid,
      errors: this.errors,
      resource_data: this.resourceData,
    };
  }
}
