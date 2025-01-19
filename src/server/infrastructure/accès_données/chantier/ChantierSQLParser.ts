import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
} from '@prisma/client';
import { Territoire, TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { NOMS_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';

class ErreurChantierSansMailleNationale extends Error {
  constructor(idChantier: string) {
    super(`Erreur: le chantier '${idChantier}' n'a pas de maille nationale.`);
  }
}

function créerDonnéesTerritoires(
  territoires: Territoire[],
  chantierRows: (PrismaChantierTerritoire & {
    chantier_identite: PrismaChantierIdentite
    chantier_territoire_jalon: PrismaChantierTerritoireJalon[]
  })[],
) {
  let donnéesTerritoires: TerritoiresDonnées = {};

  territoires.forEach(t => {
    const chantierRow = chantierRows.find(c => c.territoire_code === t.code);

    donnéesTerritoires[t.code] = {
      territoireCode: t.code,
      codeInsee: t.codeInsee,
      avancement: { annuel: chantierRow?.chantier_territoire_jalon.at(0)?.taux_avancement ?? null, global: chantierRow?.taux_avancement_mandat ?? null },
      avancementPrécédent: { annuel: null, global: chantierRow?.taux_avancement_mandat_valeur_precedente ?? null },
      estApplicable: chantierRow?.est_applicable ?? null,
      météo: chantierRow?.meteo as Météo ?? 'NON_RENSEIGNEE',
      écart: chantierRow?.ecart ?? null,
      tendance: chantierRow?.tendance || null,
      dateDeMàjDonnéesQualitatives: chantierRow?.derniere_maj_date_qualitative?.toISOString() || null,
      dateDeMàjDonnéesQuantitatives: chantierRow?.date_taux_avancement_mandat?.toISOString()  ?? null,
      responsableLocal: [],
      coordinateurTerritorial: [],
      mailleSourceDonnees: chantierRow?.donnees_maille_source ? NOMS_MAILLES[chantierRow.donnees_maille_source] : null,
    };

    if (!!chantierRow) {
      const responsables = chantierRow.responsables_locaux;
      const responsablesEmails = chantierRow.responsables_locaux_mails;
      for (const [i, responsable] of (responsables || []).entries()) {
        donnéesTerritoires[t.code].responsableLocal.push({ nom: responsable, email: responsablesEmails[i] });
      }

      const coordinateurs = chantierRow.coordinateurs_territoriaux;
      const coordinateursEmails = chantierRow.coordinateurs_territoriaux_mails;
      for (const [i, coordinateur] of (coordinateurs || []).entries()) {
        donnéesTerritoires[t.code].coordinateurTerritorial.push({ nom: coordinateur, email: coordinateursEmails[i] });
      }
    }
  });

  return donnéesTerritoires;
}

export function parseChantier(
  chantierRows: (PrismaChantierTerritoire & {
    chantier_identite: PrismaChantierIdentite
    chantier_territoire_jalon: PrismaChantierTerritoireJalon[]
  })[],
  territoires: Territoire[],
  ministères: Ministère[],
): Chantier {
  const chantierMailleNationale = chantierRows.find(c => c.maille === 'NAT');
  const chantierMailleDépartementale = chantierRows.filter(c => c.maille === 'DEPT');
  const chantierMailleRégionale = chantierRows.filter(c => c.maille === 'REG');

  if (!chantierMailleNationale) {
    throw new ErreurChantierSansMailleNationale(chantierRows[0].id);
  }

  const result: Chantier = {
    id: chantierMailleNationale.id,
    nom: chantierMailleNationale.chantier_identite.nom,
    axe: chantierMailleNationale.chantier_identite.axe,
    ppg: chantierMailleNationale.chantier_identite.ppg,
    périmètreIds: chantierMailleNationale.chantier_identite.perimetre_ids,
    ate: chantierMailleNationale.chantier_identite.ate,
    statut: chantierMailleNationale.chantier_identite.statut,
    cibleAttendu: chantierMailleNationale.chantier_identite.cible_attendue,
    mailles: {
      nationale: {
        'NAT-FR': {
          territoireCode: chantierMailleNationale.territoire_code,
          codeInsee: chantierMailleNationale.code_insee,
          avancement: { annuel: chantierMailleNationale.chantier_territoire_jalon.at(0)?.taux_avancement || null, global: chantierMailleNationale.taux_avancement_mandat },
          avancementPrécédent: { annuel: null, global: chantierMailleNationale.taux_avancement_mandat_valeur_precedente ?? null },
          météo: chantierMailleNationale?.meteo as Météo ?? 'NON_RENSEIGNEE',
          écart: null,
          tendance: chantierMailleNationale.tendance,
          dateDeMàjDonnéesQualitatives: chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ?? null,
          dateDeMàjDonnéesQuantitatives: chantierMailleNationale.date_taux_avancement_mandat?.toISOString() ?? null,
          estApplicable: chantierMailleNationale.est_applicable,
          responsableLocal: [],
          coordinateurTerritorial: [],
          mailleSourceDonnees: null,
        },
      },
      departementale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'departementale'), chantierMailleDépartementale),
      regionale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'regionale'), chantierMailleRégionale),
    },
    responsables: {
      porteur: ministères.find(m => m.id === chantierMailleNationale.chantier_identite.ministeres[0]) ?? null,
      coporteurs: chantierMailleNationale.chantier_identite.ministeres.slice(1)
        .map(coporteurId => (
          ministères.find(m => m.id === coporteurId) ?? null
        ))
        .filter((coporteur): coporteur is Ministère => coporteur !== null),
      directeursAdminCentrale: [],
      directeursProjet: [],
    },
    estBaromètre: !!chantierMailleNationale.chantier_identite.est_barometre,
    estTerritorialisé: !!chantierMailleNationale.chantier_identite.est_territorialise,
    tauxAvancementDonnéeTerritorialisée: {
      'departementale': !!chantierMailleNationale.chantier_identite.possede_taux_avancement_departemental,
      'regionale': !!chantierMailleNationale.chantier_identite.possede_taux_avancement_regional,
    },
    météoDonnéeTerritorialisée: {
      'departementale': !!chantierMailleNationale.chantier_identite.possede_meteo_departemental,
      'regionale': !!chantierMailleNationale.chantier_identite.possede_meteo_regional,
    },
  };

  if (chantierMailleNationale.chantier_identite.directeurs_administration_centrale) {
    const directeurs = chantierMailleNationale.chantier_identite.directeurs_administration_centrale;
    const directions = chantierMailleNationale.chantier_identite.directions_administration_centrale;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursAdminCentrale.push({ nom: directeur, direction: directions[i] });
    }
  }

  if (chantierMailleNationale.chantier_identite.directeurs_projet && chantierMailleNationale.chantier_identite.directeurs_projet.length > 0) {
    const directeurs = chantierMailleNationale.chantier_identite.directeurs_projet;
    const emails = chantierMailleNationale.chantier_identite.directeurs_projet_mails;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursProjet.push({ nom: directeur, email: (emails[i] || null) });
    }
  }

  return result;
}

const créerDonnéesTerritoiresNew = (
  territoires: Territoire[],
  listeChantiersTerritoire: (PrismaChantierTerritoire & { chantier_territoire_jalon: PrismaChantierTerritoireJalon[] })[],
)=>  {
  let donnéesTerritoires: TerritoiresDonnées = {};

  territoires.forEach(territoire => {
    const chantierRow = listeChantiersTerritoire.find(chantierTerritoire => chantierTerritoire.territoire_code === territoire.code);

    donnéesTerritoires[territoire.code] = {
      territoireCode: territoire.code,
      codeInsee: territoire.codeInsee,
      avancement: { annuel: chantierRow?.chantier_territoire_jalon.at(0)?.taux_avancement ?? null, global: chantierRow?.taux_avancement_mandat ?? null },
      avancementPrécédent: { annuel: null, global: chantierRow?.taux_avancement_mandat_valeur_precedente ?? null },
      estApplicable: chantierRow?.est_applicable ?? null,
      météo: chantierRow?.meteo as Météo ?? 'NON_RENSEIGNEE',
      écart: chantierRow?.ecart ?? null,
      tendance: chantierRow?.tendance || null,
      dateDeMàjDonnéesQualitatives: chantierRow?.derniere_maj_date_qualitative?.toISOString() || null,
      dateDeMàjDonnéesQuantitatives: chantierRow?.date_taux_avancement_mandat?.toISOString()  ?? null,
      responsableLocal: [],
      coordinateurTerritorial: [],
      mailleSourceDonnees: chantierRow?.donnees_maille_source ? NOMS_MAILLES[chantierRow.donnees_maille_source] : null,
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
};

export const parseChantierNew = (
  chantierIdentite: (PrismaChantierIdentite & {
    chantier_territoire: (PrismaChantierTerritoire & { chantier_territoire_jalon: PrismaChantierTerritoireJalon[] })[]
  }),
  territoires: Territoire[],
  ministères: Ministère[],
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
    mailles: {
      nationale: {
        'NAT-FR': {
          territoireCode: chantierMailleNationale.territoire_code,
          codeInsee: chantierMailleNationale.code_insee,
          avancement: { annuel: chantierMailleNationale.chantier_territoire_jalon.at(0)?.taux_avancement || null, global: chantierMailleNationale.taux_avancement_mandat },
          avancementPrécédent: { annuel: null, global: chantierMailleNationale.taux_avancement_mandat_valeur_precedente ?? null },
          météo: chantierMailleNationale?.meteo as Météo ?? 'NON_RENSEIGNEE',
          écart: null,
          tendance: chantierMailleNationale.tendance,
          dateDeMàjDonnéesQualitatives: chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ?? null,
          dateDeMàjDonnéesQuantitatives: chantierMailleNationale.date_taux_avancement_mandat?.toISOString() ?? null,
          estApplicable: chantierMailleNationale.est_applicable,
          responsableLocal: [],
          coordinateurTerritorial: [],
          mailleSourceDonnees: null,
        },
      },
      departementale: créerDonnéesTerritoiresNew(territoires.filter(t => t.maille === 'departementale'), listeChantiersMailleDépartementale),
      regionale: créerDonnéesTerritoiresNew(territoires.filter(t => t.maille === 'regionale'), listeChantiersMailleRégionale),
    },
    responsables: {
      porteur: ministères.find(m => m.id === chantierIdentite.ministeres[0]) ?? null,
      coporteurs: chantierIdentite.ministeres.slice(1)
        .map(coporteurId => (
          ministères.find(m => m.id === coporteurId) ?? null
        ))
        .filter((coporteur): coporteur is Ministère => coporteur !== null),
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

