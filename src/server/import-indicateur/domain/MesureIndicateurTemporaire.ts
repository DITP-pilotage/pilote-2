import { randomUUID } from 'node:crypto';

export class MesureIndicateurTemporaire {
  private readonly _id: string;

  private readonly _rapportId: string;

  private readonly _indicId: string | null;

  private readonly _zoneId: string | null;

  private readonly _metricDate: string | null;

  private readonly _metricType: string | null;

  private readonly _metricValue: string | null;

  private constructor({
    id,
    rapportId,
    indicId,
    zoneId,
    metricDate,
    metricType,
    metricValue,
  }: {
    id: string,
    rapportId: string,
    indicId: string | null;
    metricType: string | null;
    metricValue: string | null;
    zoneId: string | null;
    metricDate: string | null
  }) {
    this._id = id;
    this._rapportId = rapportId;
    this._indicId = indicId;
    this._zoneId = zoneId;
    this._metricDate = metricDate;
    this._metricType = metricType;
    this._metricValue = metricValue;
  }


  get id(): string {
    return this._id;
  }

  get rapportId(): string {
    return this._rapportId;
  }

  get indicId(): string | null {
    return this._indicId;
  }

  get zoneId(): string | null {
    return this._zoneId;
  }

  get metricDate(): string | null {
    return this._metricDate;
  }

  get metricType(): string | null {
    return this._metricType;
  }

  get metricValue(): string | null {
    return this._metricValue;
  }

  static createMesureIndicateurTemporaire({
    id,
    rapportId,
    indicId,
    zoneId,
    metricDate,
    metricType,
    metricValue,
  }: {
    id?: string,
    rapportId: string,
    indicId: string | null,
    zoneId: string | null,
    metricDate: string | null,
    metricType: string | null,
    metricValue: string | null,
  }) {
    return new MesureIndicateurTemporaire({
      id: id || randomUUID(),
      rapportId,
      indicId,
      zoneId,
      metricDate,
      metricType,
      metricValue,
    });
  }
}
