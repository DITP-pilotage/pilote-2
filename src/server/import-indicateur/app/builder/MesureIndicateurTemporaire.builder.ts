import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';

export class MesureIndicateurTemporaireBuilder {
  private id: string = 'idIndicateur';

  private rapportId: string = 'rapportId';

  private indicId: string = 'IND-001';

  private zoneId: string = 'D009';

  private metricDate: string = '30/02/2022';

  private metricType: string = 'vi';

  private metricValue: string = '20';


  avecId(id: string): MesureIndicateurTemporaireBuilder {
    this.id = id;
    return this;
  }

  avecRapportId(rapportId: string): MesureIndicateurTemporaireBuilder {
    this.rapportId = rapportId;
    return this;
  }

  avecIndicId(indicId: string): MesureIndicateurTemporaireBuilder {
    this.indicId = indicId;
    return this;
  }

  avecZoneId(zoneId: string): MesureIndicateurTemporaireBuilder {
    this.zoneId = zoneId;
    return this;
  }

  avecMetricDate(metricDate: string): MesureIndicateurTemporaireBuilder {
    this.metricDate = metricDate;
    return this;
  }

  avecMetricType(metricType: string): MesureIndicateurTemporaireBuilder {
    this.metricType = metricType;
    return this;
  }

  avecMetricValue(metricValue: string): MesureIndicateurTemporaireBuilder {
    this.metricValue = metricValue;
    return this;
  }

  build(): MesureIndicateurTemporaire {
    return MesureIndicateurTemporaire.createMesureIndicateurTemporaire({
      id: this.id,
      rapportId: this.rapportId,
      indicId: this.indicId,
      zoneId: this.zoneId,
      metricDate: this.metricDate,
      metricType: this.metricType,
      metricValue: this.metricValue,
    });
  }
}
