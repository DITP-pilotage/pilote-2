/*
Cette classe ne possède pas encore de test car la récupération/création des données de la table raw_data.metadata_indicateur se fait par dbt
On ne peut donc pas utiliser la creation de table par migration prisma 
 */

import { IndicateurRepository } from "@/server/import-indicateur/domain/ports/IndicateurRepository";
import { InformationIndicateur } from "@/server/import-indicateur/domain/InformationIndicateur";
import Logger from "@/server/infrastructure/Logger";
import { prisma } from "@/server/db/prisma";

interface RawInformationIndicateurModel {
  indic_id: string;
  indic_schema: string | null;
}

function convertirEnInformationIndicateur(
  rawInformationIndicateur: RawInformationIndicateurModel,
): InformationIndicateur {
  return InformationIndicateur.creerInformationIndicateur({
    indicId: rawInformationIndicateur.indic_id,
    indicSchema:
      rawInformationIndicateur.indic_schema ?? "sans-contraintes.json",
  });
}

export class PrismaIndicateurRepository implements IndicateurRepository {
  async recupererInformationIndicateurParId(
    indicId: string,
  ): Promise<InformationIndicateur> {
    try {
      const metadataIndicateur =
        await prisma.metadata_indicateurs_hidden.findUnique({
          where: { indic_id: indicId },
          select: {
            indic_id: true,
            indic_schema: true,
          },
        });

      if (!metadataIndicateur) {
        return convertirEnInformationIndicateur({
          indic_id: indicId,
          indic_schema: "sans-contraintes.json",
        });
      }

      return convertirEnInformationIndicateur(metadataIndicateur);
    } catch (error: unknown) {
      Logger.error(error);
      return convertirEnInformationIndicateur({
        indic_id: indicId,
        indic_schema: "sans-contraintes.json",
      });
    }
  }
}
