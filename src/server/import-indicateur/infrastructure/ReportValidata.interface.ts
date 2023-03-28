
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

export interface ReportTask {
  errors: ReportErrorTask[]
}

export interface ReportError {}

export type ReportValidata = {
  errors: ReportError[];
  tasks: ReportTask[];
  valid: false;
} | { valid: true };
