import { chantier as ChantierPrisma } from '@prisma/client';
import { Territoire, TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';
import Chantier, { ChantierDatesDeMiseÀJour } from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

class ErreurChantierSansMailleNationale extends Error {
  constructor(idChantier: string) {
    super(`Erreur: le chantier '${idChantier}' n'a pas de maille nationale.`);
  }
}

function calculÉcart(chantierNational: ChantierPrisma, chantier?: ChantierPrisma) {
  if (!chantier || chantier.taux_avancement === null || chantierNational.taux_avancement === null) {
    return null;
  } 

  return chantier.taux_avancement - chantierNational.taux_avancement;
}

function calculerTendance(chantier?: ChantierPrisma) {
  if (!chantier || chantier.taux_avancement === null || chantier.taux_avancement_precedent === null) {
    return null;
  }

  const différence = chantier.taux_avancement - chantier.taux_avancement_precedent;

  if (différence === 0) {
    return 'STAGNATION';
  } else if (différence > 0) {
    return 'HAUSSE';
  } else {
    return 'BAISSE';
  }
}

function créerDonnéesTerritoires(
  territoires: Territoire[],
  chantierRows: ChantierPrisma[],
  chantierNational: ChantierPrisma,
  chantiersRowsDatesDeMàj: Record<Chantier['id'], Record<Territoire['code'], ChantierDatesDeMiseÀJour>>,
) {
  let donnéesTerritoires: TerritoiresDonnées = {};

  territoires.forEach(t => {    
    const chantierRow = chantierRows.find(c => c.code_insee === t.codeInsee);
    const écart = calculÉcart(chantierNational, chantierRow);
    const tendance = calculerTendance(chantierRow);

    donnéesTerritoires[t.codeInsee] = {
      codeInsee: t.codeInsee,
      avancement: { annuel: null, global: chantierRow?.taux_avancement ?? null },
      avancementPrécédent: { annuel: null, global: chantierRow?.taux_avancement_precedent ?? null },
      météo: chantierRow?.meteo as Météo ?? 'NON_RENSEIGNEE',
      écart: écart,
      tendance: tendance,
      dateDeMàjDonnéesQualitatives: chantierRow ? chantiersRowsDatesDeMàj[chantierRow.id]?.[chantierRow.territoire_code]?.dateDeMàjDonnéesQualitatives ?? null : null,
      dateDeMàjDonnéesQuantitatives: chantierRow ? chantiersRowsDatesDeMàj[chantierRow.id]?.[chantierRow.territoire_code]?.dateDeMàjDonnéesQuantitatives ?? null : null,
    };
  });

  return donnéesTerritoires;
}

export function parseChantier(
  chantierRows: ChantierPrisma[],
  territoires: Territoire[],
  ministères: Ministère[],
  chantiersRowsDatesDeMàj: Record<Chantier['id'], Record<Territoire['code'], ChantierDatesDeMiseÀJour>>,
): Chantier {
  const chantierMailleNationale = chantierRows.find(c => c.maille === 'NAT');
  const chantierMailleDépartementale = chantierRows.filter(c => c.maille === 'DEPT');
  const chantierMailleRégionale = chantierRows.filter(c => c.maille === 'REG');

  if (!chantierMailleNationale) {
    throw new ErreurChantierSansMailleNationale(chantierRows[0].id);
  }

  const tendance = calculerTendance(chantierMailleNationale);

  const result: Chantier = {
    id: chantierMailleNationale.id,
    nom: chantierMailleNationale.nom,
    axe: chantierMailleNationale.axe,
    ppg: chantierMailleNationale.ppg,
    périmètreIds: chantierMailleNationale.perimetre_ids,
    mailles: {
      nationale: {
        FR: {
          codeInsee: chantierMailleNationale.code_insee,
          avancement: { annuel: null, global: chantierMailleNationale.taux_avancement },
          avancementPrécédent: { annuel: null, global: chantierMailleNationale.taux_avancement_precedent ?? null },
          météo: chantierMailleNationale?.meteo as Météo ?? 'NON_RENSEIGNEE',
          écart: null,
          tendance: tendance,
          dateDeMàjDonnéesQualitatives: chantiersRowsDatesDeMàj[chantierMailleNationale.id]?.['NAT-FR']?.dateDeMàjDonnéesQualitatives ?? null,
          dateDeMàjDonnéesQuantitatives: chantiersRowsDatesDeMàj[chantierMailleNationale.id]?.['NAT-FR']?.dateDeMàjDonnéesQuantitatives ?? null,
        },
      },
      départementale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'départementale'), chantierMailleDépartementale, chantierMailleNationale, chantiersRowsDatesDeMàj),
      régionale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'régionale'), chantierMailleRégionale, chantierMailleNationale, chantiersRowsDatesDeMàj),
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
    estBaromètre: Boolean(chantierMailleNationale.est_barometre),
    estTerritorialisé: Boolean(chantierMailleNationale.est_territorialise),
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
