import { ReportErrorTask } from "@/server/import-indicateur/infrastructure/ReportValidata.interface";

export class ReportErrorBuilder {
  private cell: string = "Ma cellule";

  private fieldName: string | null = "Mon fieldName";

  private fieldNumber: number = 3;

  private fieldPosition: number = 3;

  private message: string =
    "La valeur ne doit comporter que des chiffres et le point comme séparateur décimal.";

  private name: string = "Format de nombre incorrect";

  private rowNumber: number = 3;

  private rowPosition: number = 3;

  private code: string = "constraint-error";

  private note: string = "note";

  private description: string = "une description";

  avecCell(cell: string): ReportErrorBuilder {
    this.cell = cell;

    return this;
  }

  avecFieldName(fieldName: string | null): ReportErrorBuilder {
    this.fieldName = fieldName;

    return this;
  }

  avecFieldNumber(fieldNumber: number): ReportErrorBuilder {
    this.fieldNumber = fieldNumber;

    return this;
  }

  avecFieldPosition(fieldPosition: number): ReportErrorBuilder {
    this.fieldPosition = fieldPosition;

    return this;
  }

  avecMessage(message: string): ReportErrorBuilder {
    this.message = message;

    return this;
  }

  avecName(name: string): ReportErrorBuilder {
    this.name = name;

    return this;
  }

  avecRowNumber(rowNumber: number): ReportErrorBuilder {
    this.rowNumber = rowNumber;

    return this;
  }

  avecRowPosition(rowPosition: number): ReportErrorBuilder {
    this.rowPosition = rowPosition;

    return this;
  }

  avecCode(code: string): ReportErrorBuilder {
    this.code = code;
    return this;
  }

  avecNote(note: string): ReportErrorBuilder {
    this.note = note;
    return this;
  }

  avecDescription(description: string): ReportErrorBuilder {
    this.description = description;
    return this;
  }

  build(): ReportErrorTask {
    return {
      cell: this.cell,
      fieldName: this.fieldName,
      fieldNumber: this.fieldNumber,
      fieldPosition: this.fieldPosition,
      message: this.message,
      type: this.name,
      rowNumber: this.rowNumber,
      rowPosition: this.rowPosition,
      code: this.code,
      note: this.note,
      description: this.description,
    };
  }
}
