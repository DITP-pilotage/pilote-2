import { mesure_indicateur as MesureIndicateur, PrismaClient } from '@prisma/client';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface';

const convertirEnModel = (indicateurData: IndicateurData): Omit<MesureIndicateur, 'date_import'>  => {
  return {
    id: indicateurData.id,
    rapport_id: indicateurData.rapportId,
    indic_id: indicateurData.indicId,
    zone_id: indicateurData.zoneId,
    metric_date: indicateurData.metricDate,
    metric_type: indicateurData.metricType,
    metric_value: indicateurData.metricValue,
  };
};

const convertirEnIndicateurData = (mesureIndicateur: MesureIndicateur): IndicateurData => {
  return IndicateurData.createIndicateurData({
    id: mesureIndicateur.id,
    rapportId: mesureIndicateur.rapport_id,
    indicId: mesureIndicateur.indic_id,
    zoneId: mesureIndicateur.zone_id,
    metricDate: mesureIndicateur.metric_date,
    metricType: mesureIndicateur.metric_type,
    metricValue: mesureIndicateur.metric_value,
  });
};

export class PrismaMesureIndicateurRepository implements MesureIndicateurRepository {
  constructor(private prismaClient: PrismaClient) {}

  async sauvegarder(listeIndicateursData: IndicateurData[]): Promise<void> {
    const listeMesuresIndicateursModel = listeIndicateursData.map(convertirEnModel);

    await this.prismaClient.mesure_indicateur.createMany({ data: listeMesuresIndicateursModel });
  }

  async recupererTout(): Promise<IndicateurData[]> {
    const listeMesuresIndicateursModel = await this.prismaClient.mesure_indicateur.findMany();

    return listeMesuresIndicateursModel.map(convertirEnIndicateurData);
  }
}
