import { PrismaClient, rapport_import_mesure_indicateur as RapportModel } from '@prisma/client';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';

import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';

function convertirEnModel(rapport: DetailValidationFichier): RapportModel {
  return {
    id: rapport.id,
    utilisateurEmail: rapport.utilisateurEmail,
    date_creation: rapport.dateCreation,
  };
}

export class PrismaRapportRepository implements RapportRepository {
  constructor(private prismaClient: PrismaClient) {}

  async sauvegarder(rapport: DetailValidationFichier): Promise<void> {
    const rapportModel = convertirEnModel(rapport);
    await this.prismaClient.rapport_import_mesure_indicateur.create({
      data: rapportModel,
    });
  }
}
