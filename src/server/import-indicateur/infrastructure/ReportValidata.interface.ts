export interface ReportValidata {
  errors: ReportError[]
  tasks: ReportTask[]
  valid: boolean
}

export interface ReportError {}

export interface ReportTask {
  errors: ReportErrorTask[]
  resource: ReportResourceTask
}

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
  data: ReportResourceTaskData
}

export type ReportResourceTaskData = string[][];
