import Chantier from "@/server/domain/chantier/Chantier.interface";
import {
  Territoire,
  TerritoiresDonnées,
} from "@/server/domain/territoire/Territoire.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import {
  EntreePrismaChantier,
  PrismaChantier,
} from "@/server/chantiers/domain/PrismaChantier";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { Meteo } from "@/server/domain/météo/Météo.interface";
import { NOMS_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";

export type ChantierContrat = Chantier;

class ErreurChantierSansMailleNationale extends Error {
  constructor(idChantier: string) {
    super(`Erreur: le chantier '${idChantier}' n'a pas de maille nationale.`);
  }
}

export function créerDonnéesTerritoires(
  territoires: Territoire[],
  chantierRows: EntreePrismaChantier[],
) {
  let donnéesTerritoires: TerritoiresDonnées = {};

  territoires.forEach((t) => {
    const chantierRow = chantierRows.find((c) => c.territoire_code === t.code);

    donnéesTerritoires[t.code] = {
      territoireCode: t.code,
      codeInsee: t.codeInsee,
      avancement: {
        annuel: verifyValeurIsNotNullOrUndefined(
          chantierRow?.chantier_territoire_jalon.at(0)?.taux_avancement,
        ),
        global: verifyValeurIsNotNullOrUndefined(
          chantierRow?.taux_avancement_mandat,
        ),
      },
      avancementPrécédent: {
        annuel: null,
        global: verifyValeurIsNotNullOrUndefined(
          chantierRow?.taux_avancement_mandat_valeur_precedente,
        ),
      },
      estApplicable: chantierRow?.est_applicable ?? null,
      météo: (chantierRow?.meteo as Meteo) ?? "NON_RENSEIGNEE",
      écart: chantierRow?.chantier_territoire_jalon?.at(0)?.ecart ?? null,
      tendance: chantierRow?.tendance || null,
      dateDeMàjDonnéesQualitatives:
        chantierRow?.derniere_maj_date_qualitative?.toISOString() || null,
      dateDeMàjDonnéesQuantitatives:
        chantierRow?.date_taux_avancement_mandat?.toISOString() ?? null,
      dateTauxAvancementAnnuel:
        chantierRow?.chantier_territoire_jalon
          .at(0)
          ?.date_taux_avancement?.toISOString() ?? null,
      responsableLocal: [],
      coordinateurTerritorial: [],
      mailleSourceDonnees: chantierRow?.donnees_maille_source
        ? NOMS_MAILLES[chantierRow.donnees_maille_source]
        : null,
      nombrePropositionValeur:
        chantierRow?.nombre_propositions_valeur_actuelle ?? 0,
      nombrePropositionValeurPonderee:
        chantierRow?.nombre_propositions_valeur_actuelle_ponderee ?? 0,
      dateTauxAvancementPrecedent:
        chantierRow?.date_taux_avancement_mandat_valeur_precedente?.toISOString() ??
        null,
    };

    if (!!chantierRow) {
      const responsables = chantierRow.responsables_locaux;
      const responsablesEmails = chantierRow.responsables_locaux_mails;
      for (const [i, responsable] of (responsables || []).entries()) {
        donnéesTerritoires[t.code].responsableLocal.push({
          nom: responsable,
          email: responsablesEmails[i],
        });
      }

      const coordinateurs = chantierRow.coordinateurs_territoriaux;
      const coordinateursEmails = chantierRow.coordinateurs_territoriaux_mails;
      for (const [i, coordinateur] of (coordinateurs || []).entries()) {
        donnéesTerritoires[t.code].coordinateurTerritorial.push({
          nom: coordinateur,
          email: coordinateursEmails[i],
        });
      }
    }
  });

  return donnéesTerritoires;
}

export const presenterEnChantierContrat = (
  chantierIdentite: PrismaChantier,
  territoires: Territoire[],
  ministères: Ministère[],
): Chantier => {
  const chantierMailleNationale = chantierIdentite.chantier_territoire.find(
    (c) => c.maille === "NAT",
  );
  const listeChantiersMailleDépartementale =
    chantierIdentite.chantier_territoire.filter((c) => c.maille === "DEPT");
  const listeChantiersMailleRégionale =
    chantierIdentite.chantier_territoire.filter((c) => c.maille === "REG");

  if (!chantierMailleNationale) {
    throw new ErreurChantierSansMailleNationale(chantierIdentite.id);
  }

  const result: Chantier = {
    id: chantierIdentite.id,
    nom: chantierIdentite.nom,
    axe: chantierIdentite.axe,
    ppg: chantierIdentite.ppg,
    périmètreIds: chantierIdentite.perimetre_ids,
    ate: chantierIdentite.ate,
    statut: chantierIdentite.statut,
    cibleAttendu: chantierIdentite.cible_attendue,
    maillesApplicables: chantierIdentite.mailles_applicables.map(
      (maille) => NOMS_MAILLES[maille],
    ),
    mailles: {
      nationale: {
        "NAT-FR": {
          territoireCode: chantierMailleNationale.territoire_code,
          codeInsee: chantierMailleNationale.code_insee,
          avancement: {
            annuel: verifyValeurIsNotNullOrUndefined(
              chantierMailleNationale.chantier_territoire_jalon.at(0)
                ?.taux_avancement,
            ),
            global: verifyValeurIsNotNullOrUndefined(
              chantierMailleNationale.taux_avancement_mandat,
            ),
          },
          avancementPrécédent: {
            annuel: null,
            global: verifyValeurIsNotNullOrUndefined(
              chantierMailleNationale.taux_avancement_mandat_valeur_precedente,
            ),
          },
          météo: (chantierMailleNationale?.meteo as Meteo) ?? "NON_RENSEIGNEE",
          écart: null,
          tendance: chantierMailleNationale.tendance,
          dateDeMàjDonnéesQualitatives:
            chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ??
            null,
          dateDeMàjDonnéesQuantitatives:
            chantierMailleNationale.date_taux_avancement_mandat?.toISOString() ??
            null,
          dateTauxAvancementAnnuel:
            chantierMailleNationale.chantier_territoire_jalon
              .at(0)
              ?.date_taux_avancement?.toISOString() ?? null,
          estApplicable: chantierMailleNationale.est_applicable,
          responsableLocal: [],
          coordinateurTerritorial: [],
          mailleSourceDonnees: null,
          nombrePropositionValeurPonderee: 0,
          nombrePropositionValeur: [
            ...listeChantiersMailleDépartementale,
            ...listeChantiersMailleRégionale,
          ].some((chantier) => chantier.nombre_propositions_valeur_actuelle > 0)
            ? 1
            : 0,
          dateTauxAvancementPrecedent:
            chantierMailleNationale.date_taux_avancement_mandat_valeur_precedente?.toISOString() ??
            null,
        },
      },
      departementale: créerDonnéesTerritoires(
        territoires.filter((t) => t.maille === "departementale"),
        listeChantiersMailleDépartementale,
      ),
      regionale: créerDonnéesTerritoires(
        territoires.filter((t) => t.maille === "regionale"),
        listeChantiersMailleRégionale,
      ),
    },
    responsables: {
      porteur:
        ministères.find((m) => m.id === chantierIdentite.ministeres[0]) ?? null,
      coporteurs: chantierIdentite.ministeres
        .slice(1)
        .map(
          (coporteurId) => ministères.find((m) => m.id === coporteurId) ?? null,
        )
        .filter((coporteur): coporteur is Ministère => coporteur !== null),
      directeursAdminCentrale: [],
      directeursProjet: [],
    },
    estBaromètre: !!chantierIdentite.est_barometre,
    estTerritorialisé: !!chantierIdentite.est_territorialise,
    tauxAvancementDonnéeTerritorialisée: {
      departementale: !!chantierIdentite.possede_taux_avancement_departemental,
      regionale: !!chantierIdentite.possede_taux_avancement_regional,
    },
    météoDonnéeTerritorialisée: {
      departementale: !!chantierIdentite.possede_meteo_departemental,
      regionale: !!chantierIdentite.possede_meteo_regional,
    },
    territoiresApplicables: chantierIdentite.chantier_territoire
      .filter((chantierTerritoire) => chantierTerritoire.est_applicable)
      .map((chantierTerritoire) => chantierTerritoire.territoire_code),
  };

  if (chantierIdentite.directeurs_administration_centrale) {
    const directeurs = chantierIdentite.directeurs_administration_centrale;
    const directions = chantierIdentite.directions_administration_centrale;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursAdminCentrale.push({
        nom: directeur,
        direction: directions[i],
      });
    }
  }

  if (
    chantierIdentite.directeurs_projet &&
    chantierIdentite.directeurs_projet.length > 0
  ) {
    const directeurs = chantierIdentite.directeurs_projet;
    const emails = chantierIdentite.directeurs_projet_mails;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursProjet.push({
        nom: directeur,
        email: emails[i] || null,
      });
    }
  }

  return result;
};
