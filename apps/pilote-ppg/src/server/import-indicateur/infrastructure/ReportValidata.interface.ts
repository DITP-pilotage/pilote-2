export interface ReportValidata {
  errors: ReportErrorTask[];
  valid: boolean;
}

export type ReportResourceData = string[][];

export type ReportValidataWithData = {
  errors: ReportErrorTask[];
  valid: boolean;
} & {
  resource_data: ReportResourceData;
};

export interface ReportErrorTask {
  cell?: string;
  fieldName: string | null;
  fieldNumber: number;
  fieldPosition?: number;
  description: string;
  message: string;
  type: string;
  rowNumber?: number;
  rowPosition?: number;
  code: string;
  note: string;
}
