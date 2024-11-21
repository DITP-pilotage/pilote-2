import { chantier as ChantierPrisma } from '@prisma/client';
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
  chantierRows: ChantierPrisma[],
) {
  let donnéesTerritoires: TerritoiresDonnées = {};

  territoires.forEach(t => {
    const chantierRow = chantierRows.find(c => c.territoire_code === t.code);

    donnéesTerritoires[t.code] = {
      territoireCode: t.code,
      codeInsee: t.codeInsee,
      avancement: { annuel: chantierRow?.taux_avancement_annuel ?? null, global: chantierRow?.taux_avancement ?? null },
      avancementPrécédent: { annuel: null, global: chantierRow?.taux_avancement_precedent ?? null },
      estApplicable: chantierRow?.est_applicable ?? null,
      météo: chantierRow?.meteo as Météo ?? 'NON_RENSEIGNEE',
      écart: chantierRow?.ecart ?? null,
      tendance: chantierRow?.tendance || null,
      dateDeMàjDonnéesQualitatives: chantierRow?.derniere_maj_date_qualitative?.toISOString() || null,
      dateDeMàjDonnéesQuantitatives: chantierRow?.taux_avancement_date?.toISOString()  ?? null,
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
  chantierRows: ChantierPrisma[],
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
    nom: chantierMailleNationale.nom,
    axe: chantierMailleNationale.axe,
    ppg: chantierMailleNationale.ppg,
    périmètreIds: chantierMailleNationale.perimetre_ids,
    ate: chantierMailleNationale.ate,
    statut: chantierMailleNationale.statut,
    cibleAttendu: chantierMailleNationale.cible_attendue,
    mailles: {
      nationale: {
        'NAT-FR': {
          territoireCode: chantierMailleNationale.territoire_code,
          codeInsee: chantierMailleNationale.code_insee,
          avancement: { annuel: chantierMailleNationale.taux_avancement_annuel, global: chantierMailleNationale.taux_avancement },
          avancementPrécédent: { annuel: null, global: chantierMailleNationale.taux_avancement_precedent ?? null },
          météo: chantierMailleNationale?.meteo as Météo ?? 'NON_RENSEIGNEE',
          écart: null,
          tendance: chantierMailleNationale.tendance,
          dateDeMàjDonnéesQualitatives: chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ?? null,
          dateDeMàjDonnéesQuantitatives: chantierMailleNationale.taux_avancement_date?.toISOString() ?? null,
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
      porteur: ministères.find(m => m.id === chantierMailleNationale.ministeres[0]) ?? null,
      coporteurs: chantierMailleNationale.ministeres.slice(1)
        .map(coporteurId => (
          ministères.find(m => m.id === coporteurId) ?? null
        ))
        .filter((coporteur): coporteur is Ministère => coporteur !== null),
      directeursAdminCentrale: [],
      directeursProjet: [],
    },
    estBaromètre: !!chantierMailleNationale.est_barometre,
    estTerritorialisé: !!chantierMailleNationale.est_territorialise,
    tauxAvancementDonnéeTerritorialisée: {
      'departementale': !!chantierMailleNationale.a_taux_avancement_departemental,
      'regionale': !!chantierMailleNationale.a_taux_avancement_regional,
    },
    météoDonnéeTerritorialisée: {
      'departementale': !!chantierMailleNationale.a_meteo_departemental,
      'regionale': !!chantierMailleNationale.a_meteo_regional,
    },
  };

  if (chantierMailleNationale.directeurs_administration_centrale) {
    const directeurs = chantierMailleNationale.directeurs_administration_centrale;
    const directions = chantierMailleNationale.directions_administration_centrale;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursAdminCentrale.push({ nom: directeur, direction: directions[i] });
    }
  }

  if (chantierMailleNationale.directeurs_projet && chantierMailleNationale.directeurs_projet.length > 0) {
    const directeurs = chantierMailleNationale.directeurs_projet;
    const emails = chantierMailleNationale.directeurs_projet_mails;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursProjet.push({ nom: directeur, email: (emails[i] || null) });
    }
  }

  return result;
}
