import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ValeurIndicateurTerritoireEvenement } from "@/server/import-indicateur/domain/ValeurIndicateurTerritoireEvenement";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/import-indicateur/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export class PrismaIndicateurTerritoireValeurEvenementRepository
  implements IndicateurTerritoireValeurEvenementRepository
{
  async enregistrer(
    evenement: ValeurIndicateurTerritoireEvenement,
  ): Promise<void> {
    await prisma.indicateur_territoire_valeur_evenement.create({
      data: {
        id: evenement.id,
        indic_id: evenement.indicId,
        territoire_code: evenement.territoireCode,
        type_evenement: evenement.typeEvenement,
        type_valeur: evenement.typeValeur,
        date_valeur: evenement.dateValeur,
        donnees_complementaires:
          (evenement.donneesComplementaires as Prisma.JsonValue) ||
          Prisma.JsonNull,
        id_auteur_modification: evenement.idAuteurModification,
        correlation_id: evenement.correlationId,
      },
    });
  }
}
