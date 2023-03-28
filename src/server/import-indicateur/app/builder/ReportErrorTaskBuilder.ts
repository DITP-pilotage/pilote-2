import { ReportErrorTask } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';

export class ReportErrorTaskBuilder {
  private cell: string = 'Ma cellule';
  
  private fieldName: string = 'Mon fieldName';
  
  private fieldNumber: number = 3;
  
  private fieldPosition: number = 3;
  
  private message: string = 'La valeur ne doit comporter que des chiffres et le point comme séparateur décimal.';
  
  private name: string = 'Format de nombre incorrect';
  
  private rowNumber: number = 3;
  
  private rowPosition: number = 3;
  
  avecCell(cell: string): ReportErrorTaskBuilder {
    this.cell = cell;
  
    return this;
  }
  
  avecFieldName(fieldName: string): ReportErrorTaskBuilder {
    this.fieldName = fieldName;
  
    return this;
  }
  
  avecFieldNumber(fieldNumber: number): ReportErrorTaskBuilder {
    this.fieldNumber = fieldNumber;
  
    return this;
  }
  
  avecFieldPosition(fieldPosition: number): ReportErrorTaskBuilder {
    this.fieldPosition = fieldPosition;
  
    return this;
  }
  
  avecMessage(message: string): ReportErrorTaskBuilder {
    this.message = message;
  
    return this;
  }
  
  avecName(name: string): ReportErrorTaskBuilder {
    this.name = name;
  
    return this;
  }
  
  avecRowNumber(rowNumber: number): ReportErrorTaskBuilder {
    this.rowNumber = rowNumber;
  
    return this;
  }
  
  avecRowPosition(rowPosition: number): ReportErrorTaskBuilder {
    this.rowPosition = rowPosition;
  
    return this;
  }
  
  build(): ReportErrorTask {
    return {
      cell: this.cell,
      fieldName: this.fieldName,
      fieldNumber: this.fieldNumber,
      fieldPosition: this.fieldPosition,
      message: this.message,
      name: this.name,
      rowNumber: this.rowNumber,
      rowPosition: this.rowPosition,
    };
  }
}
