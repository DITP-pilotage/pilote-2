import { Territoire, TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';
import { Chantier } from '@/server/chantiers/domain/Chantier.interface';
import { Météo } from '@/server/chantiers/domain/Meteo';
import { NOMS_MAILLES } from '@/server/infrastructure/accès_données/maille/PrismamailleParser';
import { verifyValeurIsNotNullOrUndefined } from '@/server/utils/VerifyValeurIsNotNullOrUndefined';
import { EntreePrismaChantier, PrismaChantier } from '@/server/chantiers/infrastructure/adapters/PrismaChantier';
import { Ministere } from '@/server/chantiers/domain/Ministere';

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

  territoires.forEach(territoire => {
    const chantierRow = chantierRows.find(chantier => chantier.territoire_code === territoire.code);

    donnéesTerritoires[territoire.code] = {
      territoireCode: territoire.code,
      codeInsee: territoire.codeInsee,
      avancement: { annuel: verifyValeurIsNotNullOrUndefined(chantierRow?.chantier_territoire_jalon.at(0)?.taux_avancement), global: verifyValeurIsNotNullOrUndefined(chantierRow?.taux_avancement_mandat) },
      avancementPrécédent: { annuel: null, global: verifyValeurIsNotNullOrUndefined(chantierRow?.taux_avancement_mandat_valeur_precedente) },
      estApplicable: chantierRow?.est_applicable ?? null,
      météo: chantierRow?.meteo as Météo ?? 'NON_RENSEIGNEE',
      écart: chantierRow?.ecart ?? null,
      tendance: chantierRow?.tendance || null,
      dateDeMàjDonnéesQualitatives: chantierRow?.derniere_maj_date_qualitative?.toISOString() || null,
      dateDeMàjDonnéesQuantitatives: chantierRow?.date_taux_avancement_mandat?.toISOString()  ?? null,
      responsableLocal: [],
      coordinateurTerritorial: [],
      mailleSourceDonnees: chantierRow?.donnees_maille_source ? NOMS_MAILLES[chantierRow.donnees_maille_source] : null,
      nombrePropositionValeur: chantierRow?.nombre_propositions_valeur_actuelle ?? 0,
      nombrePropositionValeurPonderee: chantierRow?.nombre_propositions_valeur_actuelle_ponderee ?? 0,
      dateTauxAvancementPrecedent: chantierRow?.date_taux_avancement_mandat_valeur_precedente?.toISOString() ?? null,
    };

    if (!!chantierRow) {
      const responsables = chantierRow.responsables_locaux;
      const responsablesEmails = chantierRow.responsables_locaux_mails;
      for (const [i, responsable] of (responsables || []).entries()) {
        donnéesTerritoires[territoire.code].responsableLocal.push({ nom: responsable, email: responsablesEmails[i] });
      }

      const coordinateurs = chantierRow.coordinateurs_territoriaux;
      const coordinateursEmails = chantierRow.coordinateurs_territoriaux_mails;
      for (const [i, coordinateur] of (coordinateurs || []).entries()) {
        donnéesTerritoires[territoire.code].coordinateurTerritorial.push({ nom: coordinateur, email: coordinateursEmails[i] });
      }
    }
  });

  return donnéesTerritoires;
}

export const parseChantierNew = (
  chantierIdentite: PrismaChantier,
  territoires: Territoire[],
  ministères: Ministere[],
): Chantier => {
  const chantierMailleNationale = chantierIdentite.chantier_territoire.find(c => c.maille === 'NAT');
  const listeChantiersMailleDépartementale = chantierIdentite.chantier_territoire.filter(c => c.maille === 'DEPT');
  const listeChantiersMailleRégionale = chantierIdentite.chantier_territoire.filter(c => c.maille === 'REG');

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
    maillesApplicables: chantierIdentite.mailles_applicables.map(maille => NOMS_MAILLES[maille]),
    mailles: {
      nationale: {
        'NAT-FR': {
          territoireCode: chantierMailleNationale.territoire_code,
          codeInsee: chantierMailleNationale.code_insee,
          avancement: { annuel: verifyValeurIsNotNullOrUndefined(chantierMailleNationale.chantier_territoire_jalon.at(0)?.taux_avancement), global: verifyValeurIsNotNullOrUndefined(chantierMailleNationale.taux_avancement_mandat) },
          avancementPrécédent: { annuel: null, global: verifyValeurIsNotNullOrUndefined(chantierMailleNationale.taux_avancement_mandat_valeur_precedente) },
          météo: chantierMailleNationale?.meteo as Météo ?? 'NON_RENSEIGNEE',
          écart: null,
          tendance: chantierMailleNationale.tendance,
          dateDeMàjDonnéesQualitatives: chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ?? null,
          dateDeMàjDonnéesQuantitatives: chantierMailleNationale.date_taux_avancement_mandat?.toISOString() ?? null,
          estApplicable: chantierMailleNationale.est_applicable,
          responsableLocal: [],
          coordinateurTerritorial: [],
          mailleSourceDonnees: null,
          nombrePropositionValeurPonderee: 0,
          nombrePropositionValeur: [...listeChantiersMailleDépartementale, ...listeChantiersMailleRégionale].some(chantier => chantier.nombre_propositions_valeur_actuelle > 0) ? 1 : 0,
          dateTauxAvancementPrecedent: chantierMailleNationale.date_taux_avancement_mandat_valeur_precedente?.toISOString() ?? null,
        },
      },
      departementale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'departementale'), listeChantiersMailleDépartementale),
      regionale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'regionale'), listeChantiersMailleRégionale),
    },
    responsables: {
      porteur: ministères.find(m => m.id === chantierIdentite.ministeres[0]) ?? null,
      coporteurs: chantierIdentite.ministeres.slice(1)
        .map(coporteurId => (
          ministères.find(m => m.id === coporteurId) ?? null
        ))
        .filter((coporteur): coporteur is Ministere => coporteur !== null),
      directeursAdminCentrale: [],
      directeursProjet: [],
    },
    estBaromètre: !!chantierIdentite.est_barometre,
    estTerritorialisé: !!chantierIdentite.est_territorialise,
    tauxAvancementDonnéeTerritorialisée: {
      'departementale': !!chantierIdentite.possede_taux_avancement_departemental,
      'regionale': !!chantierIdentite.possede_taux_avancement_regional,
    },
    météoDonnéeTerritorialisée: {
      'departementale': !!chantierIdentite.possede_meteo_departemental,
      'regionale': !!chantierIdentite.possede_meteo_regional,
    },
  };

  if (chantierIdentite.directeurs_administration_centrale) {
    const directeurs = chantierIdentite.directeurs_administration_centrale;
    const directions = chantierIdentite.directions_administration_centrale;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursAdminCentrale.push({ nom: directeur, direction: directions[i] });
    }
  }

  if (chantierIdentite.directeurs_projet && chantierIdentite.directeurs_projet.length > 0) {
    const directeurs = chantierIdentite.directeurs_projet;
    const emails = chantierIdentite.directeurs_projet_mails;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursProjet.push({ nom: directeur, email: (emails[i] || null) });
    }
  }

  return result;
};

