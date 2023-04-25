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
  fieldName: string | null,
  fieldNumber: number,
  fieldPosition: number,
  message: string,
  name: string,
  rowNumber: number,
  rowPosition: number,
  code: string,
  note: string
}

export interface ReportResourceTask {
  data: ReportResourceTaskData
}

export type ReportResourceTaskData = string[][];
