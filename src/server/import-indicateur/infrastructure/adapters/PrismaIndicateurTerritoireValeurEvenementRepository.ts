import { Prisma } from "@prisma/client";
import { IndicateurTerritoireValeurEvenement } from "@/server/import-indicateur/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/import-indicateur/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { TypeValeur } from "@/server/import-indicateur/domain/TypeValeur";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export class PrismaIndicateurTerritoireValeurEvenementRepository
  implements IndicateurTerritoireValeurEvenementRepository
{
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma;
  }

  async recupererParIndicIdTerritoireCodeEtTypeValeur(args: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
  }): Promise<IndicateurTerritoireValeurEvenement[]> {
    const lignes = await this.prisma
      .getInstance()
      .indicateur_territoire_valeur_evenement.findMany({
        where: {
          indic_id: args.indicId,
          territoire_code: args.territoireCode,
          type_valeur: args.typeValeur,
        },
        orderBy: [{ date_valeur: "desc" }, { ordre: "desc" }],
      });
    return lignes.map((ligne) =>
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
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
    evenement: IndicateurTerritoireValeurEvenement,
  ): Promise<void> {
    await this.prisma
      .getInstance()
      .indicateur_territoire_valeur_evenement.create({
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
    evenements: IndicateurTerritoireValeurEvenement[],
  ): Promise<void> {
    await this.prisma
      .getInstance()
      .indicateur_territoire_valeur_evenement.createMany({
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
