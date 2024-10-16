import { mesure_indicateur as MesureIndicateur } from '@prisma/client';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface';
import { prisma } from '@/server/db/prisma';

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
  async sauvegarder(listeIndicateursData: IndicateurData[]): Promise<void> {
    const listeMesuresIndicateursModel = listeIndicateursData.map(convertirEnModel);

    await prisma.mesure_indicateur.createMany({ data: listeMesuresIndicateursModel });
  }

  async recupererTout(): Promise<IndicateurData[]> {
    const listeMesuresIndicateursModel = await prisma.mesure_indicateur.findMany();

    return listeMesuresIndicateursModel.map(convertirEnIndicateurData);
  }
}
