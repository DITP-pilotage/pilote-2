import { Prisma } from "@prisma/client";
import {
  IndicateurTerritoireValeurEvenement,
  DonneesComplementaires,
} from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import {
  IndicateurTerritoireValeurEvenementRepository,
  PropositionValeurAvancementRapport,
} from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { TypeValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeValeur";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { toISODate } from "@/server/app/domain/Dates";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import { formaterDate } from "@/client/utils/date/date";

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
          dateCreation: ligne.date_creation,
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
          dateCreation: ligne.date_creation,
        },
      ),
    );

    return EvenementsSurDate.pourDate(
      {
        indicId: args.indicId,
        territoireCode: args.territoireCode,
        date: toISODate(args.dateValeur),
      },
      evenements,
    );
  }

  async recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA({
    indicId,
    territoireCode,
    typeValeur,
    dateValeur,
  }: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
    dateValeur: Date;
  }): Promise<EvenementsSurDate[]> {
    const lignes = await this.prisma
      .getInstance()
      .indicateur_territoire_valeur_evenement.findMany({
        where: {
          indic_id: indicId,
          territoire_code: territoireCode,
          type_valeur: typeValeur,
          date_valeur: {
            gt: dateValeur,
          },
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
          dateCreation: ligne.date_creation,
        },
      ),
    );

    // Grouper les événements par date (format ISO)
    const evenementsGroupesParDate = new Map<
      string,
      IndicateurTerritoireValeurEvenement[]
    >();

    for (const evenement of evenements) {
      const dateISO = toISODate(evenement.dateValeur);
      if (!evenementsGroupesParDate.has(dateISO)) {
        evenementsGroupesParDate.set(dateISO, []);
      }
      evenementsGroupesParDate.get(dateISO)!.push(evenement);
    }

    // Créer un EvenementsSurDate pour chaque date, triés par date décroissante
    const evenementsSurDates: EvenementsSurDate[] = [];
    const datesTries = [...evenementsGroupesParDate.keys()].sort().reverse();

    for (const date of datesTries) {
      const evenementsPourDate = evenementsGroupesParDate.get(date)!;
      const evenementsSurDate = EvenementsSurDate.pourDate(
        {
          indicId,
          territoireCode,
          date,
        },
        evenementsPourDate,
      );
      evenementsSurDates.push(evenementsSurDate);
    }

    return evenementsSurDates;
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
            this.convertirEnDonneesComplementairesModel(evenement),
          id_auteur_modification: evenement.idAuteurModification,
          correlation_id: evenement.correlationId,
          ordre: evenement.ordre,
          date_creation: evenement.dateCreation,
        },
      });
  }

  async recupererHistoriqueParIndicIdEtTerritoireCode(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<IndicateurTerritoireValeurEvenement[]> {
    const lignes = await this.prisma
      .getInstance()
      .indicateur_territoire_valeur_evenement.findMany({
        where: {
          indic_id: args.indicId,
          territoire_code: args.territoireCode,
        },
        orderBy: [{ date_valeur: "desc" }, { ordre: "desc" }],
      });

    return lignes.map((ligne) => {
      const rawDonnesComplementaires = ligne.donnees_complementaires as
        | { motif: string; source_donnee_methode_calcul: string }
        | { motif: string }
        | undefined;
      const donneesComplementaires = rawDonnesComplementaires?.motif
        ? (
            rawDonnesComplementaires as {
              motif: string;
              source_donnee_methode_calcul: string;
            }
          ).source_donnee_methode_calcul
          ? {
              motif: rawDonnesComplementaires.motif,
              sourceDonneeEtMethodeCalcul: (
                rawDonnesComplementaires as {
                  motif: string;
                  source_donnee_methode_calcul: string;
                }
              ).source_donnee_methode_calcul,
            }
          : {
              motif: rawDonnesComplementaires.motif,
            }
        : undefined;
      return IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          id: ligne.id,
          indicId: ligne.indic_id,
          territoireCode: ligne.territoire_code,
          typeEvenement: ligne.type_evenement,
          typeValeur: ligne.type_valeur,
          dateValeur: ligne.date_valeur,
          valeur: ligne.valeur!,
          donneesComplementaires,
          idAuteurModification: ligne.id_auteur_modification,
          correlationId: ligne.correlation_id,
          ordre: ligne.ordre,
          dateCreation: ligne.date_creation,
        },
      );
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
          date_creation: evenement.dateCreation,
        })),
      });
  }

  private convertirEnDonneesComplementairesModel(
    evenement: IndicateurTerritoireValeurEvenement,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (evenement.donneesComplementaires === undefined) {
      return Prisma.JsonNull;
    }

    if (evenement.typeEvenement === "PROPOSITION_VALEUR_CREEE") {
      const typedEvenement =
        evenement as IndicateurTerritoireValeurEvenement<"PROPOSITION_VALEUR_CREEE">;
      return {
        motif: typedEvenement.donneesComplementaires.motif,
        source_donnee_methode_calcul:
          typedEvenement.donneesComplementaires.sourceDonneeEtMethodeCalcul,
      };
    } else if (evenement.typeEvenement === "PROPOSITION_VALEUR_MODIFIEE") {
      const typedEvenement =
        evenement as IndicateurTerritoireValeurEvenement<"PROPOSITION_VALEUR_MODIFIEE">;
      return {
        motif: typedEvenement.donneesComplementaires.motif,
        source_donnee_methode_calcul:
          typedEvenement.donneesComplementaires.sourceDonneeEtMethodeCalcul,
      };
    } else if (evenement.typeEvenement === "PROPOSITION_VALEUR_ACCEPTEE") {
      const typedEvenement =
        evenement as IndicateurTerritoireValeurEvenement<"PROPOSITION_VALEUR_ACCEPTEE">;
      return {
        motif: typedEvenement.donneesComplementaires.motif,
      };
    } else if (evenement.typeEvenement === "PROPOSITION_VALEUR_SUPPRIMEE") {
      const typedEvenement =
        evenement as IndicateurTerritoireValeurEvenement<"PROPOSITION_VALEUR_SUPPRIMEE">;
      return {
        motif: typedEvenement.donneesComplementaires.motif,
      };
    } else {
      {
        return Prisma.JsonNull;
      }
    }
  }

  async recupererLesPropositionsEnCoursParChantierIds(): Promise<
    Map<string, Map<string, PropositionValeurAvancementRapport[]>>
  > {
    const propositions = await this.prisma
      .getInstance()
      .indicateur_territoire_valeur_evenement.findMany({
        where: {
          type_evenement: {
            in: [
              "PROPOSITION_VALEUR_CREEE",
              "PROPOSITION_VALEUR_MODIFIEE",
              "PROPOSITION_VALEUR_SUPPRIMEE",
              "PROPOSITION_VALEUR_REFUSEE",
              "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
              "PROPOSITION_VALEUR_ACCEPTEE",
              "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
              "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
              "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
            ],
          },
          indicateur_territoire: {
            indicateur_identite: {
              statut: "PUBLIE",
              chantier_identite: { statut: "PUBLIE" },
            },
            est_applicable: true,
          },
        },
        orderBy: [
          { indic_id: "asc" },
          { territoire_code: "asc" },
          { date_valeur: "asc" },
          { ordre: "desc" },
        ],
        select: {
          indic_id: true,
          territoire_code: true,
          date_valeur: true,
          type_evenement: true,
          valeur: true,
          indicateur_territoire: {
            select: {
              chantier_id: true,
              valeur_actuelle_mandat: true,
              date_valeur_actuelle_mandat: true,
              territoire: {
                select: {
                  nom: true,
                },
              },
              indicateur_identite: {
                select: {
                  nom: true,
                  unite_mesure: true,
                },
              },
            },
          },
        },
      });

    const dernierEvenementProposition = Object.values(
      propositions.reduce(
        (acc, proposition) => {
          const key = `${proposition.indic_id}-${proposition.territoire_code}-${proposition.date_valeur.toISOString()}`;
          if (!acc[key]) {
            acc[key] = proposition;
          }
          return acc;
        },
        {} as Record<string, (typeof propositions)[number]>,
      ),
    );

    const propositionsEnCours = dernierEvenementProposition.filter(
      (evenement) =>
        [
          EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
        ].includes(evenement.type_evenement),
    );

    return propositionsEnCours.reduce((acc, proposition) => {
      const chantierId = proposition.indicateur_territoire.chantier_id;
      const indicateurId = proposition.indic_id;

      const rapport: PropositionValeurAvancementRapport = {
        indicateurId,
        territoireCode: proposition.territoire_code,
        valeurAvancementProposee: Number.isInteger(proposition.valeur)
          ? proposition.valeur!.toString()
          : proposition.valeur!.toFixed(1).toString(),
        dateValeurAvancement: formaterDate(
          proposition.indicateur_territoire.date_valeur_actuelle_mandat?.toISOString(),
          "DD/MM/YYYY",
        )!,
        valeurAvancementReference: Number.isInteger(
          proposition.indicateur_territoire.valeur_actuelle_mandat,
        )
          ? (proposition.indicateur_territoire.valeur_actuelle_mandat?.toString() ??
            "")
          : (proposition.indicateur_territoire.valeur_actuelle_mandat
              ?.toFixed(1)
              .toString() ?? ""),
        nomIndicateur:
          proposition.indicateur_territoire.indicateur_identite.nom,
        uniteIndicateur:
          proposition.indicateur_territoire.indicateur_identite.unite_mesure ??
          "",
        nomTerritoire: proposition.indicateur_territoire.territoire.nom,
      };

      if (!acc.has(chantierId)) {
        acc.set(chantierId, new Map());
      }

      const indicateurMap = acc.get(chantierId)!;

      if (!indicateurMap.has(indicateurId)) {
        indicateurMap.set(indicateurId, []);
      }

      indicateurMap.get(indicateurId)!.push(rapport);

      return acc;
    }, new Map<string, Map<string, PropositionValeurAvancementRapport[]>>());
  }
}
