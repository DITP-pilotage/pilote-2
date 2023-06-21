import { chantier } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import { Territoire, TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

class ErreurChantierSansMailleNationale extends Error {
  constructor(idChantier: string) {
    super(`Erreur: le chantier '${idChantier}' n'a pas de maille nationale.`);
  }
}

function créerDonnéesTerritoires(territoires: Territoire[], chantierRows: chantier[]) {
  let donnéesTerritoires: TerritoiresDonnées = {};

  territoires.forEach(t => {
    const chantierRow = chantierRows.find(c => c.code_insee === t.codeInsee);

    donnéesTerritoires[t.codeInsee] = {
      codeInsee: t.codeInsee,
      avancement: { annuel: null, global: chantierRow?.taux_avancement ?? null },
      météo: chantierRow?.meteo as Météo ?? 'NON_RENSEIGNEE',
      écart: faker.datatype.number({ min: -20, max: 20, precision: 3 }),
      estEnAlerteNonMaj: faker.datatype.boolean(),
      tendance: faker.helpers.arrayElement<'BAISSE' | 'HAUSSE' | 'STAGNATION'>(['BAISSE', 'HAUSSE', 'STAGNATION']),
    };
  });

  return donnéesTerritoires;
}

export function parseChantier(chantierRows: chantier[], territoires: Territoire[], ministères: Ministère[]): Chantier {

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
    mailles: {
      nationale: {
        FR: {
          codeInsee: chantierMailleNationale.code_insee,
          avancement: { annuel: null, global: chantierMailleNationale.taux_avancement },
          météo: chantierMailleNationale?.meteo as Météo ?? 'NON_RENSEIGNEE',
          écart: faker.datatype.number({ min: -20, max: 20, precision: 3 }),
          estEnAlerteNonMaj: faker.datatype.boolean(),
          tendance: faker.helpers.arrayElement<'BAISSE' | 'HAUSSE' | 'STAGNATION'>(['BAISSE', 'HAUSSE', 'STAGNATION']),
        },
      },
      départementale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'départementale'), chantierMailleDépartementale),
      régionale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'régionale'), chantierMailleRégionale),
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
