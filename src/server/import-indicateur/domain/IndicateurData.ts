import { v4 as uuid } from 'uuid';

export class IndicateurData {
  private constructor({
    id,
    indicId,
    zoneId,
    metricDate,
    metricType,
    metricValue,
  }: { id: string, indicId: string; metricType: string; metricValue: string; zoneId: string; metricDate: string }) {
    this._id = id;
    this._indicId = indicId;
    this._zoneId = zoneId;
    this._metricDate = metricDate;
    this._metricType = metricType;
    this._metricValue = metricValue;
  }

  private readonly _id: string;

  private readonly _indicId: string;

  private readonly _zoneId: string;

  private readonly _metricDate: string;

  private readonly _metricType: string;

  private readonly _metricValue: string;


  get id(): string {
    return this._id;
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
    indicId,
    zoneId,
    metricDate,
    metricType,
    metricValue,
  }: {
    id?: string,
    indicId: string,
    zoneId: string,
    metricDate: string,
    metricType: string,
    metricValue: string,
  }) {
    return new IndicateurData({
      id: id || uuid(),
      indicId,
      zoneId,
      metricDate,
      metricType,
      metricValue,
    });
  }
}
