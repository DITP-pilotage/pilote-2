export class AcceptedValue {
  private _orderId;

  private _value;

  private _name;

  private _desc;


  private constructor({ orderId, value, name, desc }: { orderId: number, value: string, name: string, desc: string }) {
    this._orderId = orderId;
    this._value = value;
    this._name = name;
    this._desc = desc;
  }

  get orderId() {
    return this._orderId;
  }

  get value() {
    return this._value;
  }

  get name() {
    return this._name;
  }

  get desc() {
    return this._desc;
  }

  static créerAcceptedValue({ orderId, value, name, desc }: {
    orderId: number,
    value: string,
    name: string,
    desc: string
  }) {
    return new AcceptedValue({ orderId, value, name, desc });
  }
}
