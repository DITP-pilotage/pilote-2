import {
  indicateur_identite as PrismaIndicateurIdentite,
  indicateur_territoire as PrismaIndicateurTerritoire,
  indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon,
  indicateur_territoire_valeur_evenement as PrismaIndicateurTerritoireValeurEvenement,
  utilisateur as PrismaUtilisateur,
} from "@prisma/client";
import { DonneeIndicateur } from "@/server/chantiers/domain/DonneeIndicateur";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { Météo } from "@/server/domain/météo/Météo.interface";
import { IndicateurPourExport } from "@/server/chantiers/domain/IndicateurPourExport";
import { prisma } from "@/server/db/prisma";
import { historique_valeurs } from "@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository";
import { HistoriqueIndicateurPourExport } from "@/server/chantiers/domain/HistoriqueIndicateurPourExport";
import {
  DetailsIndicateurs,
  DetailIndicateurPropositionValeurAvancement,
} from "@/server/chantiers/domain/DetailsIndicateurs";
import { comparerDates, formatDate } from "@/client/utils/date/date";
import {
  EVENEMENT_VALEUR_PROPOSITION_VALEUR_TERMINEE,
  EvenementValeurEnum,
} from "@/server/app/domain/EvenementValeurEnum";

const convertirEnDonneeIndicateur = (
  prismaIndicateurIdentite: PrismaIndicateurIdentite & {
    indicateur_territoire: (PrismaIndicateurTerritoire & {
      indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[];
    })[];
  },
): DonneeIndicateur[] => {
  return prismaIndicateurIdentite.indicateur_territoire.map(
    (prismaIndicateurTerritoire) => {
      const indicateurTerritoireJalon =
        prismaIndicateurTerritoire.indicateur_territoire_jalon[0];
      return DonneeIndicateur.creerDonneeIndicateur({
        indicId: prismaIndicateurIdentite.id,
        zoneId: prismaIndicateurTerritoire.zone_id,
        maille: prismaIndicateurTerritoire.maille,
        codeInsee: prismaIndicateurTerritoire.code_insee,
        territoireCode: prismaIndicateurTerritoire.territoire_code,
        valeurInitiale: prismaIndicateurTerritoire.valeur_initiale,
        dateValeurInitiale: prismaIndicateurTerritoire.date_valeur_initiale,
        valeurAvancement: verifyValeurIsNotNullOrUndefined(
          indicateurTerritoireJalon?.valeur_actuelle,
        ),
        dateValeurAvancement:
          indicateurTerritoireJalon?.date_valeur_actuelle || null,
        valeurCibleAnnuelle: verifyValeurIsNotNullOrUndefined(
          indicateurTerritoireJalon?.valeur_cible,
        ),
        dateValeurCibleAnnuelle:
          indicateurTerritoireJalon?.date_valeur_cible || null,
        tauxAvancementAnnuel: verifyValeurIsNotNullOrUndefined(
          indicateurTerritoireJalon?.taux_avancement,
        ),
        valeurCibleGlobale: prismaIndicateurTerritoire.valeur_cible_mandat,
        dateValeurCibleGlobale:
          prismaIndicateurTerritoire.date_valeur_cible_mandat,
        tauxAvancementGlobale:
          prismaIndicateurTerritoire.taux_avancement_mandat,
        estBarometre: prismaIndicateurIdentite.est_barometre || false,
      });
    },
  );
};

export class PrismaIndicateurRepository implements IndicateurRepository {
  async listerParIndicId({
    indicId,
    jalon,
  }: {
    indicId: string;
    jalon: number;
  }): Promise<DonneeIndicateur[]> {
    const indicateurIdentite = await prisma.indicateur_identite.findUnique({
      where: { id: indicId },
      include: {
        indicateur_territoire: {
          include: {
            indicateur_territoire_jalon: {
              where: {
                jalon,
              },
            },
          },
        },
      },
    });

    return indicateurIdentite
      ? convertirEnDonneeIndicateur(indicateurIdentite)
      : [];
  }

  async supprimerPropositionValeurAvancement({
    indicId,
    territoireCode,
    auteurModification,
  }: {
    indicId: string;
    territoireCode: string;
    auteurModification: string;
  }): Promise<void> {
    await prisma.indicateur_territoire.update({
      where: {
        id_territoire_code: {
          id: indicId,
          territoire_code: territoireCode,
        },
      },
      data: {
        motif_proposition: null,
        date_proposition: null,
        valeur_actuelle_proposition: null,
        taux_avancement_mandat_proposition: null,
        source_donnee_methode_calcul_proposition: null,
        auteur_proposition: auteurModification,
      },
    });

    await prisma.indicateur_territoire_jalon.update({
      where: {
        id_territoire_code_jalon: {
          id: indicId,
          territoire_code: territoireCode,
          jalon: 2025,
        },
      },
      data: {
        taux_avancement_proposition: null,
      },
    });
  }

  async recupererPourExports(
    chantierId: string,
    territoireCodesLecture: string[],
    jalon: number,
    estAvecCadrage: boolean = false,
  ): Promise<IndicateurPourExport[]> {
    const listeChantierTerritoires = await prisma.chantier_territoire.findMany({
      where: {
        id: chantierId,
      },
      select: {
        territoire_code: true,
        maille: true,
        taux_avancement_mandat: true,
        est_applicable: true,
        nombre_propositions_valeur_actuelle: true,
        territoire: {
          select: {
            code_parent: true,
          },
        },
      },
    });

    const chantiersTerritoiresMailleDepartement =
      listeChantierTerritoires.filter(
        (chantierTerritoire) => chantierTerritoire.maille === "DEPT",
      );
    const chantierTerritoireMailleDepartementApplicables =
      chantiersTerritoiresMailleDepartement.filter(
        (chantierTerritoire) => chantierTerritoire.est_applicable,
      );

    const result = await prisma.indicateur_territoire.findMany({
      where: {
        territoire_code: {
          in: territoireCodesLecture,
        },
        indicateur_identite: {
          chantier_id: chantierId,
          chantier_identite: {
            NOT: [
              {
                ministeres: { isEmpty: true },
              },
            ],
          },
        },
        chantier_territoire: {
          est_applicable: true,
        },
      },
      select: {
        maille: true,
        code_insee: true,
        valeur_initiale: true,
        date_valeur_initiale: true,
        valeur_actuelle_mandat: true,
        date_valeur_actuelle_mandat: true,
        valeur_cible_mandat: true,
        date_valeur_cible_mandat: true,
        taux_avancement_mandat: true,
        est_applicable: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
          select: {
            valeur_cible: true,
            date_valeur_cible: true,
            taux_avancement: true,
            valeur_actuelle: true,
            date_valeur_actuelle: true,
          },
        },
        indicateur_identite: {
          select: {
            id: true,
            nom: true,
            chantier_id: true,
            mailles_applicables: true,
            chantier_identite: {
              select: {
                ministeres_acronymes: true,
                ministeres: true,
                est_barometre: true,
                est_territorialise: true,
                statut: true,
                nom: true,
                axe: true,
                perimetre_ids: true,
                cible_attendue: true,
              },
            },
          },
        },
        territoire: {
          select: {
            nom: true,
            territoire_parent: {
              select: {
                nom: true,
              },
            },
          },
        },
        chantier_territoire: {
          select: {
            maille: true,
            territoire_code: true,
            nombre_propositions_valeur_actuelle: true,
            meteo: true,
            taux_avancement_mandat: true,
            est_applicable: true,
            ecart: true,
            tendance: true,
            chantier_territoire_jalon: {
              select: {
                taux_avancement: true,
              },
              where: {
                jalon,
              },
            },
          },
        },
      },
    });

    let listeMetadataIndicateurs: {
      indic_id: string;
      indic_descr: string | null;
      indic_methode_calcul: string | null;
      indic_source: string | null;
    }[] = [];

    let listeMetadataIndicateursComplementaires: {
      indic_id: string;
      delai_disponibilite: number | null;
      periodicite: string | null;
    }[] = [];

    if (estAvecCadrage) {
      listeMetadataIndicateurs = await prisma.metadata_indicateurs.findMany({
        where: {
          indic_id: {
            in: result.map((indicateur) => indicateur.indicateur_identite.id),
          },
        },
        select: {
          indic_id: true,
          indic_descr: true,
          indic_methode_calcul: true,
          indic_source: true,
        },
      });

      listeMetadataIndicateursComplementaires =
        await prisma.metadata_indicateurs_complementaire.findMany({
          where: {
            indic_id: {
              in: result.map((indicateur) => indicateur.indicateur_identite.id),
            },
          },
          select: {
            indic_id: true,
            delai_disponibilite: true,
            periodicite: true,
          },
        });
    }

    return result
      .map((indicateurPourExport) => {
        const indicateurTerritoireJalon =
          indicateurPourExport.indicateur_territoire_jalon.at(0);
        const chantierTerritoireJalon =
          indicateurPourExport.chantier_territoire.chantier_territoire_jalon.at(
            0,
          );

        const prismaChantierTerritoire =
          indicateurPourExport.chantier_territoire;
        let aUnePropositionsValeurAvancement = false;
        const maille = prismaChantierTerritoire.maille;
        if (maille === "DEPT") {
          aUnePropositionsValeurAvancement =
            prismaChantierTerritoire.nombre_propositions_valeur_actuelle > 0;
        } else if (maille === "REG") {
          const codeRegion = prismaChantierTerritoire.territoire_code;
          aUnePropositionsValeurAvancement =
            prismaChantierTerritoire.nombre_propositions_valeur_actuelle > 0 ||
            listeChantierTerritoires
              .filter(
                (chantierTerritoire) =>
                  chantierTerritoire.territoire.code_parent === codeRegion,
              )
              .some(
                (chantierTerritoire) =>
                  chantierTerritoire.nombre_propositions_valeur_actuelle > 0,
              );
        } else {
          aUnePropositionsValeurAvancement = listeChantierTerritoires.some(
            (chantierTerritoire) =>
              chantierTerritoire.nombre_propositions_valeur_actuelle > 0,
          );
        }

        const informationMetadataIndicateur = estAvecCadrage
          ? listeMetadataIndicateurs.find(
              (metadataIndicateur) =>
                metadataIndicateur.indic_id ===
                indicateurPourExport.indicateur_identite.id,
            )
          : null;
        const informationMetadataIndicateurComplementaire = estAvecCadrage
          ? listeMetadataIndicateursComplementaires.find(
              (metadataIndicateurComplementaire) =>
                metadataIndicateurComplementaire.indic_id ===
                indicateurPourExport.indicateur_identite.id,
            )
          : null;

        const informationCadrage = estAvecCadrage
          ? {
              description: informationMetadataIndicateur?.indic_descr || null,
              methodeCalcul:
                informationMetadataIndicateur?.indic_methode_calcul || null,
              source: informationMetadataIndicateur?.indic_source || null,
              periodesMiseAJour:
                informationMetadataIndicateurComplementaire?.periodicite ||
                null,
              delaiDisponibilite:
                informationMetadataIndicateurComplementaire?.delai_disponibilite ||
                null,
            }
          : {
              description: null,
              methodeCalcul: null,
              source: null,
              periodesMiseAJour: null,
              delaiDisponibilite: null,
            };

        return {
          maille: indicateurPourExport.maille,
          régionNom:
            indicateurPourExport.maille === "DEPT"
              ? indicateurPourExport.territoire.territoire_parent?.nom || null
              : indicateurPourExport.territoire.nom,
          départementNom:
            indicateurPourExport.maille === "DEPT"
              ? indicateurPourExport.territoire.nom
              : null,
          codeInsee: indicateurPourExport.code_insee,
          chantierMinistèreNom: indicateurPourExport.indicateur_identite
            .chantier_identite.ministeres_acronymes
            ? indicateurPourExport.indicateur_identite.chantier_identite
                .ministeres_acronymes[0]
            : null,
          axe: indicateurPourExport.indicateur_identite.chantier_identite.axe,
          chantierNom:
            indicateurPourExport.indicateur_identite.chantier_identite.nom,
          chantierId: indicateurPourExport.indicateur_identite.chantier_id,
          chantierStatut:
            indicateurPourExport.indicateur_identite.chantier_identite.statut,
          chantierEstApplicable:
            indicateurPourExport.chantier_territoire.est_applicable,
          chantierEstBaromètre:
            indicateurPourExport.indicateur_identite.chantier_identite
              .est_barometre,
          chantierEstTerritorialise:
            indicateurPourExport.indicateur_identite.chantier_identite
              .est_territorialise,
          chantierAvancementGlobal: verifyValeurIsNotNullOrUndefined(
            indicateurPourExport.chantier_territoire.taux_avancement_mandat,
          ),
          chantierAvancementAnnuel: verifyValeurIsNotNullOrUndefined(
            chantierTerritoireJalon?.taux_avancement,
          ),
          périmètreIds:
            indicateurPourExport.indicateur_identite.chantier_identite
              .perimetre_ids,
          météo: indicateurPourExport.chantier_territoire.meteo as Météo | null,
          nom: indicateurPourExport.indicateur_identite.nom,
          valeurInitiale: indicateurPourExport.valeur_initiale,
          dateValeurInitiale:
            indicateurPourExport.date_valeur_initiale?.toISOString() || null,
          valeurAvancement: verifyValeurIsNotNullOrUndefined(
            indicateurTerritoireJalon?.valeur_actuelle,
          ),
          dateValeurAvancement:
            indicateurTerritoireJalon?.date_valeur_actuelle?.toISOString() ||
            null,
          valeurCibleAnnuelle: verifyValeurIsNotNullOrUndefined(
            indicateurTerritoireJalon?.valeur_cible,
          ),
          dateValeurCibleAnnuelle:
            indicateurTerritoireJalon?.date_valeur_cible?.toISOString() || null,
          avancementAnnuel: verifyValeurIsNotNullOrUndefined(
            indicateurTerritoireJalon?.taux_avancement,
          ),
          valeurCible: indicateurPourExport.valeur_cible_mandat,
          dateValeurCible:
            indicateurPourExport.date_valeur_cible_mandat?.toISOString() ||
            null,
          avancementGlobal: indicateurPourExport.taux_avancement_mandat,
          maillesApplicables:
            indicateurPourExport.indicateur_identite.mailles_applicables,
          estApplicable: indicateurPourExport.est_applicable,
          chantierEcart: indicateurPourExport.chantier_territoire.ecart,
          chantierTendance: indicateurPourExport.chantier_territoire.tendance,
          chantierCibleAttendue:
            indicateurPourExport.indicateur_identite.chantier_identite
              .cible_attendue,
          chantierAUnTauxAvancementDepartemental:
            chantierTerritoireMailleDepartementApplicables.length === 0 ||
            chantierTerritoireMailleDepartementApplicables.some(
              (chantierTerritoire) =>
                chantierTerritoire.taux_avancement_mandat !== null,
            ),
          chantierAUnePropositionValeurAvancement:
            aUnePropositionsValeurAvancement,
          ...informationCadrage,
        };
      })
      .sort((indicA, indicB) => {
        const orderMaille = { NAT: 1, REG: 2, DEPT: 3 };

        // Comparer par nom
        if (indicB.chantierNom !== indicA.chantierNom) {
          return indicB.chantierNom.localeCompare(indicA.chantierNom);
        }

        // Comparer par nom_indicateur
        if (indicB.nom !== indicA.nom) {
          return indicB.nom.localeCompare(indicA.nom);
        }

        // Comparer par maille
        if (indicA.maille !== indicB.maille) {
          return orderMaille[indicA.maille] - orderMaille[indicB.maille];
        }

        // Comparer par nom_region
        const nomRegionA =
          indicB.maille === "DEPT"
            ? indicB.régionNom || null
            : indicB.maille === "REG"
              ? indicB.départementNom
              : null;
        const nomRegionB =
          indicA.maille === "DEPT"
            ? indicA.régionNom || null
            : indicA.maille === "REG"
              ? indicA.départementNom
              : null;
        if (nomRegionA && nomRegionB && nomRegionA !== nomRegionB) {
          return nomRegionA.localeCompare(nomRegionB);
        } // Comparer par code insee
        if (indicB.codeInsee !== indicA.codeInsee) {
          return indicB.codeInsee.localeCompare(indicA.codeInsee);
        }

        // Comparer par ministere
        if (indicB.chantierMinistèreNom === null) {
          return 1;
        }
        if (indicA.chantierMinistèreNom === null) {
          return -1;
        }
        return indicB.chantierMinistèreNom.localeCompare(
          indicA.chantierMinistèreNom,
        );
      });
  }

  async récupérerHistoriquePourExports(
    chantierId: string,
    territoireCodesLecture: string[],
    jalon: number,
  ): Promise<HistoriqueIndicateurPourExport[]> {
    const result = await prisma.indicateur_identite.findMany({
      where: {
        chantier_id: chantierId,
        chantier_identite: {
          NOT: [
            {
              ministeres: { isEmpty: true },
            },
          ],
        },
      },
      select: {
        nom: true,
        chantier_id: true,
        mailles_applicables: true,
        chantier_identite: {
          select: {
            est_barometre: true,
            est_territorialise: true,
            nom: true,
            perimetre_ids: true,
            statut: true,
            cible_attendue: true,
            chantier_territoire: {
              select: {
                maille: true,
                territoire_code: true,
                nombre_propositions_valeur_actuelle: true,
                est_applicable: true,
                taux_avancement_mandat: true,
                territoire: {
                  select: {
                    code_parent: true,
                  },
                },
              },
            },
          },
        },
        indicateur_territoire: {
          where: {
            territoire_code: {
              in: territoireCodesLecture,
            },
          },
          select: {
            maille: true,
            code_insee: true,
            territoire_code: true,
            valeur_initiale: true,
            date_valeur_initiale: true,
            evolution_valeur_actuelle: true,
            valeur_cible_mandat: true,
            date_valeur_cible_mandat: true,
            est_applicable: true,
            indicateur_territoire_jalon: {
              where: {
                jalon,
              },
              select: {
                valeur_cible: true,
                date_valeur_cible: true,
                taux_avancement: true,
                valeur_actuelle: true,
                date_valeur_actuelle: true,
              },
            },
            territoire: {
              select: {
                nom: true,
                code_parent: true,
                territoire_parent: {
                  select: {
                    nom: true,
                  },
                },
              },
            },
            chantier_territoire: {
              select: {
                territoire_code: true,
                est_applicable: true,
                meteo: true,
                ecart: true,
                tendance: true,
                taux_avancement_mandat: true,
                nombre_propositions_valeur_actuelle: true,
              },
            },
          },
        },
      },
    });

    return result
      .flatMap((indicateurIdentite) => {
        const listeTerritoireChantier =
          indicateurIdentite.chantier_identite.chantier_territoire;
        const chantierTerritoiresMailleDepartementale =
          listeTerritoireChantier.filter(
            (territoireChantier) =>
              territoireChantier.maille === "DEPT" &&
              territoireChantier.est_applicable,
          );

        return indicateurIdentite.indicateur_territoire.flatMap(
          (indicateurPourExport) => {
            const indicateurTerritoireJalon =
              indicateurPourExport.indicateur_territoire_jalon.at(0);
            const chantierTerritoire = indicateurPourExport.chantier_territoire;
            let aUnePropositionsValeurAvancement = false;
            const maille = indicateurPourExport.maille;
            if (maille === "DEPT") {
              aUnePropositionsValeurAvancement =
                chantierTerritoire.nombre_propositions_valeur_actuelle > 0;
            } else if (maille === "REG") {
              const codeRegion = chantierTerritoire.territoire_code;
              aUnePropositionsValeurAvancement =
                chantierTerritoire.nombre_propositions_valeur_actuelle > 0 ||
                listeTerritoireChantier
                  .filter(
                    (chantier) =>
                      chantier.territoire.code_parent === codeRegion,
                  )
                  .some(
                    (chantier) =>
                      chantier.nombre_propositions_valeur_actuelle > 0,
                  );
            } else {
              aUnePropositionsValeurAvancement = listeTerritoireChantier.some(
                (chantier) => chantier.nombre_propositions_valeur_actuelle > 0,
              );
            }
            return (
              indicateurPourExport.evolution_valeur_actuelle as unknown as historique_valeurs[]
            ).map((historiqueIndicateur) => ({
              maille: indicateurPourExport.maille,
              régionNom:
                indicateurPourExport.maille === "DEPT"
                  ? indicateurPourExport.territoire.territoire_parent?.nom ||
                    null
                  : indicateurPourExport.territoire.nom,
              départementNom:
                indicateurPourExport.maille === "DEPT"
                  ? indicateurPourExport.territoire.nom
                  : null,
              codeInsee: indicateurPourExport.code_insee,
              chantierNom: indicateurIdentite.chantier_identite.nom,
              chantierId: indicateurIdentite.chantier_id,
              nom: indicateurIdentite.nom,
              valeurInitiale: indicateurPourExport.valeur_initiale,
              dateValeurInitiale:
                indicateurPourExport.date_valeur_initiale?.toISOString() ||
                null,
              valeurCibleAnnuelle: verifyValeurIsNotNullOrUndefined(
                indicateurTerritoireJalon?.valeur_cible,
              ),
              dateValeurCibleAnnuelle:
                indicateurTerritoireJalon?.date_valeur_cible?.toISOString() ||
                null,
              valeurCible: indicateurPourExport.valeur_cible_mandat,
              dateValeurCible:
                indicateurPourExport.date_valeur_cible_mandat?.toISOString() ||
                null,
              valeurAvancement: verifyValeurIsNotNullOrUndefined(
                historiqueIndicateur.valeur,
              ),
              dateValeurAvancement: historiqueIndicateur.date,
              périmètreIds: indicateurIdentite.chantier_identite.perimetre_ids,
              météo: indicateurPourExport.chantier_territoire
                .meteo as Météo | null,
              chantierEstBaromètre:
                indicateurIdentite.chantier_identite.est_barometre,
              chantierEstTerritorialise:
                indicateurIdentite.chantier_identite.est_territorialise,
              chantierStatut: indicateurIdentite.chantier_identite.statut,
              estApplicable: indicateurPourExport.est_applicable,
              maillesApplicables: indicateurIdentite.mailles_applicables,
              chantierEcart: indicateurPourExport.chantier_territoire.ecart,
              chantierTendance:
                indicateurPourExport.chantier_territoire.tendance,
              chantierCibleAttendue:
                indicateurIdentite.chantier_identite.cible_attendue,
              chantierAUnTauxAvancementDepartemental:
                chantierTerritoiresMailleDepartementale.length === 0 ||
                chantierTerritoiresMailleDepartementale.some(
                  (chantier) => chantier.taux_avancement_mandat !== null,
                ),
              chantierAUnePropositionValeurAvancement:
                aUnePropositionsValeurAvancement,
              chantierAvancementGlobal:
                indicateurPourExport.chantier_territoire.taux_avancement_mandat,
            }));
          },
        );
      })
      .sort((indicA, indicB) => {
        const orderMaille = { NAT: 1, REG: 2, DEPT: 3 };

        // Comparer par nom_indicateur
        if (indicB.nom !== indicA.nom) {
          return indicB.nom.localeCompare(indicA.nom);
        }

        // Comparer par maille
        if (indicA.maille !== indicB.maille) {
          return orderMaille[indicA.maille] - orderMaille[indicB.maille];
        }

        // Comparer par nom_region
        const nomRegionA =
          indicB.maille === "DEPT"
            ? indicB.régionNom || null
            : indicB.maille === "REG"
              ? indicB.départementNom
              : null;
        const nomRegionB =
          indicA.maille === "DEPT"
            ? indicA.régionNom || null
            : indicA.maille === "REG"
              ? indicA.départementNom
              : null;
        if (nomRegionA && nomRegionB && nomRegionA !== nomRegionB) {
          return nomRegionA.localeCompare(nomRegionB);
        } // Comparer par code insee
        if (indicB.codeInsee !== indicA.codeInsee) {
          return indicB.codeInsee.localeCompare(indicA.codeInsee);
        }

        return indicB.dateValeurAvancement.localeCompare(
          indicA.dateValeurAvancement,
        );
      });
  }

  async recupererDetailsParChantierIdEtTerritoire(
    chantierId: string,
    territoireCodes: string[],
    jalon: number,
  ): Promise<DetailsIndicateurs> {
    const indicateurs = await prisma.indicateur_territoire.findMany({
      where: {
        territoire_code: { in: territoireCodes },
        indicateur_identite: {
          chantier_id: chantierId,
          NOT: {
            type_id: null,
          },
        },
      },
      include: {
        indicateur_identite: true,
        indicateur_territoire_jalon: true,
        indicateur_territoire_valeur_evenement: {
          include: {
            auteur: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
          orderBy: [
            {
              date_creation: "desc",
            },
            {
              ordre: "desc",
            },
          ],
        },
      },
    });

    return this.convertirEnDetailsIndicateurs(indicateurs, jalon);
  }

  private convertirEnDetailsIndicateurs(
    indicateurs: (PrismaIndicateurTerritoire & {
      indicateur_identite: PrismaIndicateurIdentite;
      indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[];
      indicateur_territoire_valeur_evenement: (PrismaIndicateurTerritoireValeurEvenement & {
        auteur: Pick<PrismaUtilisateur, "nom" | "prenom">;
      })[];
    })[],
    jalon: number,
  ): DetailsIndicateurs {
    const détailsIndicateurs: DetailsIndicateurs = {};

    for (const indicateurRow of indicateurs) {
      if (!détailsIndicateurs[indicateurRow.id]) {
        détailsIndicateurs[indicateurRow.id] = {};
      }

      const indicateurTerritoireJalon =
        indicateurRow.indicateur_territoire_jalon.find(
          (indicateurJalon) => indicateurJalon.jalon === jalon,
        );

      détailsIndicateurs[indicateurRow.id][indicateurRow.territoire_code] = {
        dateValeurAvancementMandat: formatDate(
          indicateurRow.date_valeur_actuelle_mandat,
        ),
        valeurAvancementMandat: indicateurRow.valeur_actuelle_mandat,
        codeInsee: indicateurRow.code_insee,
        valeurInitiale: indicateurRow.valeur_initiale,
        dateValeurInitiale: formatDate(indicateurRow.date_valeur_initiale),
        historiquesValeurs: indicateurRow
          ? (
              (indicateurRow.evolution_valeur_actuelle as unknown as historique_valeurs[]) ||
              []
            ).sort((a, b) => comparerDates(a.date, b.date))
          : [],
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
        proposition: this.recupererPropositionValeurAvancement(
          indicateurRow,
          indicateurTerritoireJalon,
        ),
        unite: indicateurRow.indicateur_identite.unite_mesure,
        estApplicable: indicateurRow.est_applicable,
        dateImport: formatDate(
          indicateurRow.indicateur_identite.dernier_import_date_indic,
        ),
        ponderation: indicateurRow.ponderation_zone_reel,
        prochaineDateValeurAvancement: formatDate(
          indicateurRow.prochaine_date_valeur_actuelle,
        ),
        prochaineDateMaj: formatDate(indicateurRow.prochaine_date_maj),
        prochaineDateMajJours: indicateurRow.prochaine_date_maj_jours,
        estAJour: indicateurRow.est_a_jour,
        tendance: indicateurRow.tendance,
        listeValeursCiblesAnnuelles:
          indicateurRow.indicateur_territoire_jalon.map((indicateurJalon) => ({
            annee: indicateurJalon.jalon,
            valeurCible: indicateurJalon.valeur_cible,
          })),
      };
    }

    return détailsIndicateurs;
  }

  private recupererPropositionValeurAvancement(
    indicateurRow: PrismaIndicateurTerritoire & {
      indicateur_territoire_valeur_evenement: (PrismaIndicateurTerritoireValeurEvenement & {
        auteur: Pick<PrismaUtilisateur, "nom" | "prenom">;
      })[];
    },
    indicateurTerritoireJalon: PrismaIndicateurTerritoireJalon | undefined,
  ): DetailIndicateurPropositionValeurAvancement | null {
    const dernierEvenementProposition =
      indicateurRow.indicateur_territoire_valeur_evenement.find(
        (evenement) =>
          evenement.type_evenement !== EvenementValeurEnum.VALEUR_CREEE &&
          evenement.type_evenement !== EvenementValeurEnum.VALEUR_MODIFIEE &&
          evenement.type_evenement !== EvenementValeurEnum.VALEUR_HISTORISEE,
      ) || null;

    return dernierEvenementProposition &&
      !EVENEMENT_VALEUR_PROPOSITION_VALEUR_TERMINEE.includes(
        dernierEvenementProposition.type_evenement,
      )
      ? {
          valeurAvancement: dernierEvenementProposition.valeur!,
          tauxAvancement: indicateurRow.taux_avancement_mandat_proposition_v2,
          tauxAvancementIntermediaire:
            indicateurTerritoireJalon !== undefined
              ? indicateurTerritoireJalon.taux_avancement_proposition_v2
              : null,
          auteur: `${dernierEvenementProposition.auteur.prenom} ${dernierEvenementProposition.auteur.nom}`,
          dateProposition: formatDate(dernierEvenementProposition.date_valeur),
          motif:
            (
              dernierEvenementProposition.donnees_complementaires as {
                motif: string;
              }
            )?.motif || null,
          sourceDonneeEtMethodeCalcul:
            (
              dernierEvenementProposition.donnees_complementaires as {
                source_donnee_methode_calcul: string;
              }
            )?.source_donnee_methode_calcul || null,
        }
      : null;
  }
}
