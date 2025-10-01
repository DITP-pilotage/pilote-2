export interface AcceptedValueForm {
  orderId: number;
  value: string;
  name: string;
  desc: string;
}

export interface MetadataIndicateurForm {
  name: string;
  dataType: "text" | "boolean" | "number";
  description: string;
  metaPiloteShow: boolean;
  metaPiloteAlias: string;
  metaPiloteEditIsEditable: boolean;
  metaPiloteEditRegex: string;
  metaPiloteEditRegexViolationMessage: string | null;
  metaPiloteEditBoxType: "text" | "textarea" | "boolean" | "multi-select" | null;
  metaPiloteDefaultValue: string | number | null | boolean;
  metaPiloteMandatory: boolean;
  metaPiloteDispDispDesc: boolean;
  acceptedValues: AcceptedValueForm[];
}
