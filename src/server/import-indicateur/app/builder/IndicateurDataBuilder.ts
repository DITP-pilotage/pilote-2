import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';

export class IndicateurDataBuilder {
  private id: string = 'idIndicateur';

  private indicId: string = 'IND-001';

  private zoneId: string = 'D009';

  private metricDate: string = '30/02/2022';

  private metricType: string = 'vi';

  private metricValue: string = '20';


  avecId(id: string): IndicateurDataBuilder {
    this.id = id;
    return this;
  }

  avecIndicId(indicId: string): IndicateurDataBuilder {
    this.indicId = indicId;
    return this;
  }

  avecZoneId(zoneId: string): IndicateurDataBuilder {
    this.zoneId = zoneId;
    return this;
  }

  avecMetricDate(metricDate: string): IndicateurDataBuilder {
    this.metricDate = metricDate;
    return this;
  }

  avecMetricType(metricType: string): IndicateurDataBuilder {
    this.metricType = metricType;
    return this;
  }

  avecMetricValue(metricValue: string): IndicateurDataBuilder {
    this.metricValue = metricValue;
    return this;
  }

  build(): IndicateurData {
    return IndicateurData.createIndicateurData({
      id: this.id,
      indicId: this.indicId,
      zoneId: this.zoneId,
      metricDate: this.metricDate,
      metricType: this.metricType,
      metricValue: this.metricValue,
    });
  }
}
