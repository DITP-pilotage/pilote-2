import { randomUUID } from 'node:crypto';

import { ACCEPTED_DATE_FORMAT } from '@/server/import-indicateur/domain/enum/ACCEPTED_DATE_FORMAT';

export class MesureIndicateurTemporaire {
  private readonly _id: string;

  private readonly _rapportId: string;

  private readonly _indicId: string | null;

  private _zoneId: string | null;

  private _metricDate: string | null;

  private _metricType: string | null;

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

  convertirDateProvenantDuFormat(acceptedDateFormat: ACCEPTED_DATE_FORMAT) {
    if (!this._metricDate) return;
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (acceptedDateFormat) {
      case ACCEPTED_DATE_FORMAT.DD_MM_YYYY: {
        this._metricDate = this._metricDate.split('/').reverse().join('-');
        break;
      }
      case ACCEPTED_DATE_FORMAT.MM_DD_YY: {
        const tmpDate = this._metricDate.split('-');
        this._metricDate = `20${tmpDate[2]}-${tmpDate[0]}-${tmpDate[1]}`;
        break;
      }
    }
  }

  mettreTypeValeurEnMinuscule() {
    if (!this._metricType) return;
    this._metricType = this._metricType.toLowerCase();
  }

  mettreZoneIdEnMajuscule() {
    if (!this._zoneId) return;
    this._zoneId = this._zoneId.toUpperCase();
  }
}
