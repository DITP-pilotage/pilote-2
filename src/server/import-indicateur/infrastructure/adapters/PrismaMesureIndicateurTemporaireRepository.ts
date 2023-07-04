import { mesure_indicateur_temporaire as MesureIndicateurTemporaireModel, PrismaClient } from '@prisma/client';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';

const convertirEnModel = (mesureIndicateurTemporaire: MesureIndicateurTemporaire): Omit<MesureIndicateurTemporaireModel, 'date_import'> => {
  return {
    id: mesureIndicateurTemporaire.id,
    rapport_id: mesureIndicateurTemporaire.rapportId,
    indic_id: mesureIndicateurTemporaire.indicId,
    zone_id: mesureIndicateurTemporaire.zoneId,
    metric_date: mesureIndicateurTemporaire.metricDate,
    metric_type: mesureIndicateurTemporaire.metricType,
    metric_value: mesureIndicateurTemporaire.metricValue,
  };
};

const convertirEnMesureIndicateurTemporaire = (mesureIndicateur: MesureIndicateurTemporaireModel): MesureIndicateurTemporaire => {
  return MesureIndicateurTemporaire.createMesureIndicateurTemporaire({
    id: mesureIndicateur.id,
    rapportId: mesureIndicateur.rapport_id,
    indicId: mesureIndicateur.indic_id,
    zoneId: mesureIndicateur.zone_id,
    metricDate: mesureIndicateur.metric_date,
    metricType: mesureIndicateur.metric_type,
    metricValue: mesureIndicateur.metric_value,
  });
};

export class PrismaMesureIndicateurTemporaireRepository implements MesureIndicateurTemporaireRepository {
  constructor(private prismaClient: PrismaClient) {}

  async sauvegarder(listeMesuresIndicateurTemporaire: MesureIndicateurTemporaire[]): Promise<void> {
    const listeMesuresIndicateursModel = listeMesuresIndicateurTemporaire.map(convertirEnModel);

    await this.prismaClient.mesure_indicateur_temporaire.createMany({ data: listeMesuresIndicateursModel });
  }

  async recupererToutParRapportId(rapportId: string): Promise<MesureIndicateurTemporaire[]> {
    const listeMesuresIndicateurTemporaireModel = await this.prismaClient.mesure_indicateur_temporaire.findMany({
      where: {
        rapport_id: rapportId,
      },
    });
    return listeMesuresIndicateurTemporaireModel.map(convertirEnMesureIndicateurTemporaire);
  }

  async supprimerToutParRapportId(rapportId: string): Promise<void> {
    await this.prismaClient.mesure_indicateur_temporaire.deleteMany({
      where: {
        rapport_id: rapportId,
      },
    });
  }
}
