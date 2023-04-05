
export interface ReportErrorTask {
  cell: string,
  fieldName: string,
  fieldNumber: number,
  fieldPosition: number,
  message: string,
  name: string,
  rowNumber: number,
  rowPosition: number,
}

export interface ReportResourceTask {
  data: string[][]
}

export interface ReportTask {
  errors: ReportErrorTask[]
  resource: ReportResourceTask
}

export interface ReportError {}

export type ReportValidata = {
  errors: ReportError[];
  tasks: ReportTask[];
  valid: boolean;
};
