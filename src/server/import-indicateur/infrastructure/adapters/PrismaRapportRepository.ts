import {
  mesure_indicateur_temporaire as MesureIndicateurTemporaireModel,
  PrismaClient,
  rapport_import_mesure_indicateur as RapportModel,
} from '@prisma/client';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';

import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import { RapportNotFoundError } from '@/server/import-indicateur/domain/errors/RapportNotFoundError';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';

function convertirEnModel(rapport: DetailValidationFichier): RapportModel {
  return {
    id: rapport.id,
    utilisateurEmail: rapport.utilisateurEmail,
    date_creation: rapport.dateCreation,
    est_valide: rapport.estValide,
  };
}

function convertirEnDetailValidationFichier(rapport: RapportModel & {
  mesure_indicateur_temporaire: MesureIndicateurTemporaireModel[]
}): DetailValidationFichier {
  return DetailValidationFichier.creerDetailValidationFichier({
    id: rapport.id,
    utilisateurEmail: rapport.utilisateurEmail,
    dateCreation: rapport.date_creation,
    estValide: true, // sauvegarder le statut 
    listeMesuresIndicateurTemporaire: rapport.mesure_indicateur_temporaire.map(mesureIndicateurTemporaire => MesureIndicateurTemporaire.createMesureIndicateurTemporaire({
      rapportId: rapport.id,
      id: mesureIndicateurTemporaire.id,
      indicId: mesureIndicateurTemporaire.indic_id,
      zoneId: mesureIndicateurTemporaire.zone_id,
      metricType: mesureIndicateurTemporaire.metric_type,
      metricDate: mesureIndicateurTemporaire.metric_date,
      metricValue: mesureIndicateurTemporaire.metric_value,
    }),
    ),
  });
}

export class PrismaRapportRepository implements RapportRepository {
  constructor(private prismaClient: PrismaClient) {}

  async sauvegarder(rapport: DetailValidationFichier): Promise<void> {
    const rapportModel = convertirEnModel(rapport);
    await this.prismaClient.rapport_import_mesure_indicateur.create({
      data: rapportModel,
    });
  }

  async récupérerRapportParId(rapportId: string): Promise<DetailValidationFichier> {
    const rapportResult = await this.prismaClient.rapport_import_mesure_indicateur.findUnique({
      where: { id: rapportId },
      include: {
        mesure_indicateur_temporaire: true,
      },
    });

    if (!rapportResult) {
      throw new RapportNotFoundError(rapportId);
    }

    return convertirEnDetailValidationFichier(rapportResult);
  }
}
