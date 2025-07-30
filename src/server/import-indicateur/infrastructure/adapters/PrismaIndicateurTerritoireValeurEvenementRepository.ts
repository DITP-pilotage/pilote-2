import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ValeurIndicateurTerritoireEvenement } from "@/server/import-indicateur/domain/ValeurIndicateurTerritoireEvenement";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/import-indicateur/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { TypeValeur } from "@/server/import-indicateur/domain/TypeValeur";

export class PrismaIndicateurTerritoireValeurEvenementRepository
  implements IndicateurTerritoireValeurEvenementRepository
{
  async recupererParIndicIdTerritoireCodeEtTypeValeur(args: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
  }): Promise<ValeurIndicateurTerritoireEvenement[]> {
    const lignes = await prisma.indicateur_territoire_valeur_evenement.findMany(
      {
        where: {
          indic_id: args.indicId,
          territoire_code: args.territoireCode,
          type_valeur: args.typeValeur,
        },
        orderBy: [{ date_valeur: "desc" }, { ordre: "desc" }],
      },
    );
    return lignes.map((ligne) =>
      ValeurIndicateurTerritoireEvenement.createValeurIndicateurTerritoireEvenement(
        {
          id: ligne.id,
          indicId: ligne.indic_id,
          territoireCode: ligne.territoire_code,
          typeEvenement: ligne.type_evenement,
          typeValeur: ligne.type_valeur,
          dateValeur: ligne.date_valeur,
          valeur: ligne.valeur,
          donneesComplementaires: ligne.donnees_complementaires as Record<
            string,
            unknown
          >,
          idAuteurModification: ligne.id_auteur_modification,
          correlationId: ligne.correlation_id,
          ordre: ligne.ordre,
        },
      ),
    );
  }

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
        valeur: evenement.valeur,
        donnees_complementaires:
          (evenement.donneesComplementaires as Prisma.JsonValue) ||
          Prisma.JsonNull,
        id_auteur_modification: evenement.idAuteurModification,
        correlation_id: evenement.correlationId,
        ordre: evenement.ordre,
      },
    });
  }

  async enregistrerTous(
    evenements: ValeurIndicateurTerritoireEvenement[],
  ): Promise<void> {
    await prisma.indicateur_territoire_valeur_evenement.createMany({
      data: evenements.map((evenement) => ({
        id: evenement.id,
        indic_id: evenement.indicId,
        territoire_code: evenement.territoireCode,
        type_evenement: evenement.typeEvenement,
        type_valeur: evenement.typeValeur,
        date_valeur: evenement.dateValeur,
        valeur: evenement.valeur,
        donnees_complementaires:
          (evenement.donneesComplementaires as Prisma.JsonValue) ||
          Prisma.JsonNull,
        id_auteur_modification: evenement.idAuteurModification,
        correlation_id: evenement.correlationId,
        ordre: evenement.ordre,
      })),
    });
  }
}
