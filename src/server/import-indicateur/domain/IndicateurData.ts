import { randomUUID } from 'node:crypto';

export class IndicateurData {
  private readonly _id: string;

  private readonly _rapportId: string;

  private readonly _indicId: string;

  private readonly _zoneId: string;

  private readonly _metricDate: string;

  private readonly _metricType: string;

  private readonly _metricValue: string;

  private constructor({
    id,
    rapportId,
    indicId,
    zoneId,
    metricDate,
    metricType,
    metricValue,
  }: { id: string, rapportId: string, indicId: string; metricType: string; metricValue: string; zoneId: string; metricDate: string }) {
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

  get indicId(): string {
    return this._indicId;
  }

  get zoneId(): string {
    return this._zoneId;
  }

  get metricDate(): string {
    return this._metricDate;
  }

  get metricType(): string {
    return this._metricType;
  }

  get metricValue(): string {
    return this._metricValue;
  }

  static createIndicateurData({
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
    indicId: string,
    zoneId: string,
    metricDate: string,
    metricType: string,
    metricValue: string,
  }) {
    return new IndicateurData({
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
