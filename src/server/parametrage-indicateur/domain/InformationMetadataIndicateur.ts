import { AcceptedValue } from '@/server/parametrage-indicateur/domain/AcceptedValue';

export class InformationMetadataIndicateur {
  private readonly _name: string;

  private readonly _dataType: 'text' | 'boolean';

  private readonly _description: string;

  private readonly _metaPiloteShow: boolean;

  private readonly _metaPiloteAlias: string;

  private readonly _metaPiloteEditIsEditable: boolean;

  private readonly _metaPiloteEditRegex: string;

  private readonly _metaPiloteEditRegexViolationMessage: string | null;

  private readonly _metaPiloteEditBoxType: 'text' | 'textarea' | 'boolean';
  
  private readonly _metaPiloteDefaultValue: string | number | null | boolean;

  private readonly _acceptedValues: AcceptedValue[];

  private constructor({ name, dataType, description, metaPiloteShow, metaPiloteAlias, metaPiloteEditIsEditable, metaPiloteEditRegex, metaPiloteEditRegexViolationMessage, metaPiloteEditBoxType, metaPiloteDefaultValue, acceptedValues }:
  { name: string, dataType: 'text' | 'boolean', description: string, metaPiloteShow: boolean, metaPiloteAlias: string, metaPiloteEditIsEditable: boolean, metaPiloteEditRegex: string, metaPiloteEditRegexViolationMessage: string | null, metaPiloteEditBoxType: 'text' | 'textarea' | 'boolean', metaPiloteDefaultValue: string | number | null | boolean, acceptedValues: AcceptedValue[] }) {
    this._name = name;
    this._dataType = dataType;
    this._description = description;
    this._metaPiloteShow = metaPiloteShow;
    this._metaPiloteAlias = metaPiloteAlias;
    this._metaPiloteEditIsEditable = metaPiloteEditIsEditable;
    this._metaPiloteEditRegex = metaPiloteEditRegex;
    this._metaPiloteEditRegexViolationMessage = metaPiloteEditRegexViolationMessage;
    this._metaPiloteEditBoxType = metaPiloteEditBoxType;
    this._metaPiloteDefaultValue = metaPiloteDefaultValue;
    this._acceptedValues = acceptedValues;
  }


  get name(): string {
    return this._name;
  }

  get dataType(): 'text' | 'boolean' {
    return this._dataType;
  }

  get description(): string {
    return this._description;
  }

  get metaPiloteShow(): boolean {
    return this._metaPiloteShow;
  }

  get metaPiloteAlias(): string {
    return this._metaPiloteAlias;
  }

  get metaPiloteEditIsEditable(): boolean {
    return this._metaPiloteEditIsEditable;
  }

  get metaPiloteEditRegex(): string {
    return this._metaPiloteEditRegex;
  }

  get metaPiloteEditRegexViolationMessage(): string | null {
    return this._metaPiloteEditRegexViolationMessage;
  }

  get metaPiloteEditBoxType(): 'text' | 'textarea' | 'boolean' {
    return this._metaPiloteEditBoxType;
  }

  get metaPiloteDefaultValue(): string | number | null | boolean {
    return this._metaPiloteDefaultValue;
  }

  get acceptedValues(): AcceptedValue[] {
    return this._acceptedValues;
  }

  static creerInformationMetadataIndicateur({ name, dataType, description, metaPiloteShow, metaPiloteAlias, metaPiloteEditIsEditable, metaPiloteEditRegex, metaPiloteEditRegexViolationMessage, metaPiloteEditBoxType, metaPiloteDefaultValue, acceptedValues }:
  { name: string, dataType: 'text' | 'boolean', description: string, metaPiloteShow: boolean, metaPiloteAlias: string, metaPiloteEditIsEditable: boolean, metaPiloteEditRegex: string, metaPiloteEditRegexViolationMessage: string | null, metaPiloteEditBoxType: 'text' | 'textarea' | 'boolean', metaPiloteDefaultValue: string | number | null | boolean, acceptedValues: AcceptedValue[]  }) {
    return new InformationMetadataIndicateur({ name, dataType, description, metaPiloteShow, metaPiloteAlias, metaPiloteEditIsEditable, metaPiloteEditRegex, metaPiloteEditRegexViolationMessage, metaPiloteEditBoxType, metaPiloteDefaultValue, acceptedValues });
  }
}
