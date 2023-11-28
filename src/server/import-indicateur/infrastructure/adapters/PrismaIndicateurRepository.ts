/*
Cette classe ne possède pas encore de test car la récupération/création des données de la table raw_data.metadata_indicateur se fait par dbt
On ne peut donc pas utiliser la creation de table par migration prisma 
 */


import { PrismaClient } from '@prisma/client';
import { IndicateurRepository } from '@/server/import-indicateur/domain/ports/IndicateurRepository';
import { InformationIndicateur } from '@/server/import-indicateur/domain/InformationIndicateur';
import Logger from '@/server/infrastructure/logger';

interface RawInformationIndicateurModel {
  indic_id: string,
  indic_schema: string,
}

function convertirEnInformationIndicateur(rawInformationIndicateur: RawInformationIndicateurModel): InformationIndicateur {
  return InformationIndicateur.creerInformationIndicateur({
    indicId: rawInformationIndicateur.indic_id,
    indicSchema: rawInformationIndicateur.indic_schema,
  });
}

export class PrismaIndicateurRepository implements IndicateurRepository {
  constructor(private prismaClient: PrismaClient) {}

  async recupererInformationIndicateurParId(indicId: string): Promise<InformationIndicateur> {
    try {
      const rawInformationIndicateur = await this.prismaClient.$queryRaw<RawInformationIndicateurModel[]>`SELECT indic_id, indic_schema
                                                                                                          FROM raw_data.metadata_indicateurs_hidden
                                                                                                          WHERE indic_id = ${indicId}`;
      if (!rawInformationIndicateur) {
        return convertirEnInformationIndicateur({
          indic_id: indicId,
          indic_schema: 'sans-contraintes.json',
        });
      }

      return convertirEnInformationIndicateur(rawInformationIndicateur[0]);
    } catch (error: unknown) {
      Logger.error(error);
      return convertirEnInformationIndicateur({
        indic_id: indicId,
        indic_schema: 'sans-contraintes.json',
      });
    }
  }
}
