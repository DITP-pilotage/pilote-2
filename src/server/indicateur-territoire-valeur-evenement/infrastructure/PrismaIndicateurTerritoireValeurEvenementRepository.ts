import { Prisma } from "@prisma/client";
import {
  IndicateurTerritoireValeurEvenement,
  DonneesComplementaires,
} from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { TypeValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeValeur";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";

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
          valeur: ligne.valeur!,
          donneesComplementaires:
            ligne.donnees_complementaires as DonneesComplementaires<
              typeof ligne.type_evenement
            >,
          idAuteurModification: ligne.id_auteur_modification,
          correlationId: ligne.correlation_id,
          ordre: ligne.ordre,
        },
      ),
    );
  }

  async recupererParIndicIdTerritoireCodeTypeValeurEtDate(args: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
    dateValeur: Date;
  }): Promise<EvenementsSurDate> {
    const lignes = await this.prisma
      .getInstance()
      .indicateur_territoire_valeur_evenement.findMany({
        where: {
          indic_id: args.indicId,
          territoire_code: args.territoireCode,
          type_valeur: args.typeValeur,
          // TODO(PVA/JOTA) - Faire un filtre sur la date de valeur
          // date_valeur: args.dateValeur,
        },
        orderBy: [{ date_valeur: "desc" }, { ordre: "desc" }],
      });

    const evenements = lignes.map((ligne) =>
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          id: ligne.id,
          indicId: ligne.indic_id,
          territoireCode: ligne.territoire_code,
          typeEvenement: ligne.type_evenement,
          typeValeur: ligne.type_valeur,
          dateValeur: ligne.date_valeur,
          valeur: ligne.valeur!,
          donneesComplementaires:
            ligne.donnees_complementaires as DonneesComplementaires<
              typeof ligne.type_evenement
            >,
          idAuteurModification: ligne.id_auteur_modification,
          correlationId: ligne.correlation_id,
          ordre: ligne.ordre,
        },
      ),
    );

    return EvenementsSurDate.pourDate(
      {
        indicId: args.indicId,
        territoireCode: args.territoireCode,
        date: args.dateValeur.toISOString().split("T")[0],
      },
      evenements,
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
          donnees_complementaires: this.convertirEnDonneesComplementairesModel(
            evenement.typeEvenement,
            evenement.donneesComplementaires,
          ),
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

  private convertirEnDonneesComplementairesModel(
    typeEvenement: TypeEvenement,
    donneesComplementaires: DonneesComplementaires<TypeEvenement>,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (donneesComplementaires === undefined) {
      return Prisma.JsonNull;
    }

    switch (typeEvenement) {
      case "PROPOSITION_VALEUR_CREEE":
        return {
          motif: donneesComplementaires.motif,
          source_donnee_methode_calcul:
            donneesComplementaires.sourceDonneeEtMethodeCalcul,
        };
      default: {
        return Prisma.JsonNull;
      }
    }
  }
}
