import { mesure_indicateur as MesureIndicateur } from '@prisma/client';
import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';

const convertirEnModel = (indicateurData: IndicateurData): MesureIndicateur => {
  return {
    id: indicateurData.id,
    indicId: indicateurData.indicId,
    zoneId: indicateurData.zoneId,
    metricDate: indicateurData.metricDate,
    metricType: indicateurData.metricType,
    metricValue: indicateurData.metricValue,
  };
};

const convertirEnIndicateurData = (mesureIndicateur: MesureIndicateur): IndicateurData => {
  return IndicateurData.createIndicateurData({
    id: mesureIndicateur.id,
    indicId: mesureIndicateur.indicId,
    zoneId: mesureIndicateur.zoneId,
    metricDate: mesureIndicateur.metricDate,
    metricType: mesureIndicateur.metricType,
    metricValue: mesureIndicateur.metricValue,
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
