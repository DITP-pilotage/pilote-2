import {
  $Enums,
  indicateur_identite as PrismaIndicateurIdentite,
  indicateur_territoire as PrismaIndicateurTerritoire,
  indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon,
  indicateur_territoire_valeur_evenement as PrismaIndicateurTerritoireValeurEvenement,
  metadata_parametrage_indicateurs as PrismaMetadataParametrageIndicateurs,
} from "@prisma/client";
import IndicateurRepository from "@/server/domain/indicateur/IndicateurRepository.interface";
import Indicateur, {
  TypeIndicateur,
} from "@/server/domain/indicateur/Indicateur.interface";
import { CODES_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import { groupByAndTransform } from "@/client/utils/arrays";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { comparerDates, formatDate } from "@/client/utils/date/date";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { prisma } from "@/server/db/prisma";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";

export interface historique_valeurs {
  date: string;
  valeur: number;
  taux_avancement_jalon?: number | null;
  taux_avancement_mandat?: number | null;
}

export default class IndicateurSQLRepository implements IndicateurRepository {
  private _mapToDomain(
    prismaIndicateurIdentite: PrismaIndicateurIdentite,
  ): Indicateur {
    return {
      id: prismaIndicateurIdentite.id,
      nom: prismaIndicateurIdentite.nom,
      type: prismaIndicateurIdentite.type_id as TypeIndicateur,
      estIndicateurDuBaromètre: prismaIndicateurIdentite.est_barometre ?? false,
      description: prismaIndicateurIdentite.description,
      source: prismaIndicateurIdentite.source,
      modeDeCalcul: prismaIndicateurIdentite.mode_de_calcul,
      unité: prismaIndicateurIdentite.unite_mesure,
      parentId: prismaIndicateurIdentite.parent_id,
      periodicite: prismaIndicateurIdentite.periodicite ?? "Non renseignée",
      delaiDisponibilite:
        prismaIndicateurIdentite.delai_disponibilite?.toString() ??
        "Non renseignée",
      responsablesDonneesMails:
        prismaIndicateurIdentite.responsables_donnees_mails,
      mailleNatAgregee: prismaIndicateurIdentite.maille_nat_agregee,
      mailleRegAgregee: prismaIndicateurIdentite.maille_reg_agregee,
    };
  }

  private _mapDétailsToDomain(
    indicateurs: (PrismaIndicateurTerritoire & {
      indicateur_identite: PrismaIndicateurIdentite;
      indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[];
      indicateur_territoire_valeur_evenement: PrismaIndicateurTerritoireValeurEvenement[];
    })[],
    jalon: number,
    dateDerniereExecutionDatajobs: Date,
    evenementsMailles: PrismaIndicateurTerritoireValeurEvenement[],
    metadataIndicateurs: PrismaMetadataParametrageIndicateurs[],
  ): DétailsIndicateurs {
    const détailsIndicateurs: DétailsIndicateurs = {};

    for (const indicateurRow of indicateurs) {
      if (!détailsIndicateurs[indicateurRow.id]) {
        détailsIndicateurs[indicateurRow.id] = {};
      }

      const indicateurTerritoireJalon =
        indicateurRow.indicateur_territoire_jalon.find(
          (indicateurJalon) => indicateurJalon.jalon === jalon,
        );

      const dateImport = this._calculerDateDernierImport(
        indicateurRow.maille,
        dateDerniereExecutionDatajobs,
        indicateurRow.indicateur_territoire_valeur_evenement,
        evenementsMailles.filter(
          (evenement) => evenement.indic_id === indicateurRow.id,
        ),
        metadataIndicateurs.find(
          (metadata) => metadata.indic_id === indicateurRow.id,
        ) ?? null,
      );

      détailsIndicateurs[indicateurRow.id][indicateurRow.territoire_code] = {
        dateValeurAvancementMandat: formatDate(
          indicateurRow.date_valeur_actuelle_mandat,
        ),
        valeurAvancementMandat: indicateurRow.valeur_actuelle_mandat,
        codeInsee: indicateurRow.code_insee,
        valeurInitiale: indicateurRow.valeur_initiale,
        dateValeurInitiale: formatDate(indicateurRow.date_valeur_initiale),
        // TODO(Tristan-10/10/2024) : Trouver une moyen de se débarasser du as unknown
        historiquesValeurs: (
          indicateurRow.evolution_avancement as unknown as historique_valeurs[]
        ).sort((a, b) => comparerDates(a.date, b.date)),
        valeurAvancement: verifyValeurIsNotNullOrUndefined(
          indicateurTerritoireJalon?.valeur_actuelle,
        ),
        dateValeurAvancement: formatDate(
          indicateurTerritoireJalon?.date_valeur_actuelle || null,
        ),
        valeurCible: indicateurRow.valeur_cible_mandat,
        dateValeurCible: formatDate(indicateurRow.date_valeur_cible_mandat),
        valeurCibleAnnuelle: verifyValeurIsNotNullOrUndefined(
          indicateurTerritoireJalon?.valeur_cible,
        ),
        dateValeurCibleAnnuelle: formatDate(
          indicateurTerritoireJalon?.date_valeur_cible || null,
        ),
        avancement: {
          global: indicateurRow.taux_avancement_mandat,
          annuel: verifyValeurIsNotNullOrUndefined(
            indicateurTerritoireJalon?.taux_avancement,
          ),
        },
        // TODO(CHAN) : Plus utilisé, uniquement pour le typing pour les rapports détaillés
        proposition: null,
        propositionStatutTerritoire: null,
        propositionStatutDirectionProjet: null,
        unite: indicateurRow.indicateur_identite.unite_mesure,
        estApplicable: indicateurRow.est_applicable,
        dateImport: formatDate(dateImport),
        ponderation: indicateurRow.ponderation_zone_reel,
        prochaineDateValeurAvancement: formatDate(
          indicateurRow.prochaine_date_valeur_actuelle,
        ),
        prochaineDateMaj: formatDate(indicateurRow.prochaine_date_maj),
        prochaineDateMajJours: indicateurRow.prochaine_date_maj_jours,
        estAJour: indicateurRow.est_a_jour,
        tendance: indicateurRow.tendance,
        listeValeursCiblesAnnuelles:
          indicateurRow.indicateur_territoire_jalon.map((indicateurJalon) => {
            return {
              annee: indicateurJalon.jalon,
              valeurCible: indicateurJalon.valeur_cible,
            };
          }),
      };
    }

    return détailsIndicateurs;
  }

  async récupérerGroupésParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<string, Indicateur[]>> {
    const listePrismaIndicateurIdentite =
      await prisma.indicateur_identite.findMany({
        where: {
          chantier_id: { in: chantiersIds },
          statut: "PUBLIE",
          NOT: {
            type_id: null,
          },
        },
      });

    return groupByAndTransform(
      listePrismaIndicateurIdentite,
      (indicateur) => indicateur.chantier_id,
      this._mapToDomain,
    );
  }

  async récupérerDétailsGroupésParChantierEtParIndicateur(
    chantiersIds: Chantier["id"][],
    maille: Maille,
    codeInsee: CodeInsee,
    jalon: number,
    dateDerniereExecutionDatajobs: Date,
  ): Promise<Record<Chantier["id"], DétailsIndicateurs>> {
    const indicateurs = await prisma.indicateur_territoire.findMany({
      where: {
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        indicateur_identite: {
          chantier_id: { in: chantiersIds },
          statut: "PUBLIE",
          NOT: {
            type_id: null,
          },
        },
      },
      include: {
        indicateur_territoire_valeur_evenement: true,
        indicateur_identite: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
        },
      },
    });

    const indicateursIds = [...new Set(indicateurs.map((ind) => ind.id))];

    const metadataIndicateurs =
      await prisma.metadata_parametrage_indicateurs.findMany({
        where: { indic_id: { in: indicateursIds } },
      });

    const evenementsMailles =
      await prisma.indicateur_territoire_valeur_evenement.findMany({
        where: {
          indic_id: { in: indicateursIds },
          type_evenement: {
            in: [
              EvenementValeurEnum.VALEUR_CREEE,
              EvenementValeurEnum.VALEUR_MODIFIEE,
            ],
          },
          date_creation: {
            lt: dateDerniereExecutionDatajobs,
          },
        },
      });

    const chantierIds = [
      ...new Set(indicateurs.map((ind) => ind.indicateur_identite.chantier_id)),
    ];

    return Object.fromEntries(
      chantierIds.map((chantierId) => {
        const indicateursChantier = indicateurs.filter(
          (ind) => ind.indicateur_identite.chantier_id === chantierId,
        );
        const details = this._mapDétailsToDomain(
          indicateursChantier,
          jalon,
          dateDerniereExecutionDatajobs,
          evenementsMailles,
          metadataIndicateurs,
        );
        return [chantierId, details] as const;
      }),
    );
  }

  private _calculerDateDernierImport(
    maille: $Enums.Maille,
    dateDerniereExecutionDatajobs: Date,
    evenementsTerritoire: PrismaIndicateurTerritoireValeurEvenement[],
    evenementsMailles: PrismaIndicateurTerritoireValeurEvenement[],
    metadataIndicateur: PrismaMetadataParametrageIndicateurs | null,
  ): Date | null {
    let evenementsAUtiliser = evenementsTerritoire;

    if (maille === "NAT" || maille === "REG") {
      let mailleSource: string | null = null;
      if (
        maille === "NAT" &&
        metadataIndicateur?.va_nat_from &&
        ["DEPT", "REG"].includes(metadataIndicateur.va_nat_from)
      ) {
        mailleSource = metadataIndicateur.va_nat_from;
      } else if (
        maille === "REG" &&
        metadataIndicateur?.va_reg_from === "DEPT"
      ) {
        mailleSource = "DEPT";
      }
      if (mailleSource) {
        evenementsAUtiliser = evenementsMailles.filter((evenement) =>
          evenement.territoire_code.startsWith(mailleSource!),
        );
      }
    }

    const evenementsImport = evenementsAUtiliser.filter(
      (evenement) =>
        [
          EvenementValeurEnum.VALEUR_CREEE,
          EvenementValeurEnum.VALEUR_MODIFIEE,
        ].includes(evenement.type_evenement) &&
        evenement.date_creation < dateDerniereExecutionDatajobs,
    );

    if (evenementsImport.length === 0) {
      return null;
    }

    return evenementsImport.reduce((maxDate, evenement) => {
      return evenement.date_creation > maxDate
        ? evenement.date_creation
        : maxDate;
    }, evenementsImport[0].date_creation);
  }

  async récupérerParChantierId(chantierId: string): Promise<Indicateur[]> {
    const listePrismaIndicateurIdentite =
      await prisma.indicateur_identite.findMany({
        where: {
          chantier_id: chantierId,
          statut: "PUBLIE",
          NOT: {
            type_id: null,
          },
        },
      });

    return listePrismaIndicateurIdentite.map((indicateur) =>
      this._mapToDomain(indicateur),
    );
  }

  async recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(
    chantiersIds: Chantier["id"][],
  ): Promise<Indicateur["id"][]> {
    const listeIndicateurs = await prisma.indicateur_territoire.findMany({
      where: {
        chantier_id: {
          in: chantiersIds,
        },
        ponderation_zone_reel: {
          not: null,
          gt: 0,
        },
        indicateur_identite: {
          statut: "PUBLIE",
        },
      },
      select: {
        id: true,
      },
      distinct: ["id"],
    });

    return listeIndicateurs.map((indicateur) => indicateur.id);
  }
}
