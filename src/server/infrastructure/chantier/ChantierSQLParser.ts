import { chantier } from '@prisma/client';
import Chantier, { Maille } from '@/server/domain/chantier/Chantier.interface';
import { météoFromString } from '@/server/domain/chantier/Météo.interface';

class ErreurChantierSansMailleNationale extends Error {
  constructor(idChantier: string) {
    super(`Erreur: le chantier '${idChantier}' n'a pas de maille nationale.`);
  }
}

class ErreurMailleChantierInconnue extends Error {
  constructor(idChantier: string, maille: string) {
    super(`Erreur: la maille '${maille}' du chantier '${idChantier}' est inconnue.`);
  }
}

const NOMS_MAILLES: Record<string, Maille> = {
  NAT: 'nationale',
  DEPT: 'départementale',
  REG: 'régionale',
};

export function parseChantier(chantierRows: chantier[]): Chantier {
  const chantierMailleNationale = chantierRows.find(c => c.maille === 'NAT');

  if (!chantierMailleNationale) {
    throw new ErreurChantierSansMailleNationale(chantierRows[0].id);
  }

  const result: Chantier = {
    id: chantierMailleNationale.id,
    nom: chantierMailleNationale.nom,
    axe: null,
    nomPPG: null,
    périmètreIds: chantierMailleNationale.perimetre_ids,
    mailles: {
      nationale: {
        FR: {
          codeInsee: chantierMailleNationale.code_insee,
          avancement: { annuel: null, global: chantierMailleNationale.taux_avancement },
          météo: météoFromString(chantierMailleNationale.meteo),
        },
      },
      départementale: {},
      régionale: {},
    },
    responsables: {
      porteur: chantierMailleNationale.ministeres[0],
      coporteurs: chantierMailleNationale.ministeres.slice(1),
      directeursAdminCentrale: [],
      directeursProjet: [],
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

  ///
  // Lignes à une maille non nationale
  const chantiersMaillesNonNationales = chantierRows.filter(c => c.maille !== 'NAT');

  for (const chantierRow of chantiersMaillesNonNationales) {
    const nomDeMaille = NOMS_MAILLES[chantierRow.maille];
    if (!nomDeMaille) {
      throw new ErreurMailleChantierInconnue(chantierMailleNationale.id, chantierRow.maille);
    }
    result.mailles[nomDeMaille] = {
      ...result.mailles[nomDeMaille],
      [chantierRow.code_insee]: {
        codeInsee: chantierRow.code_insee,
        avancement: { annuel: null, global: chantierRow.taux_avancement },
        météo: météoFromString(chantierRow.meteo),
      },
    };
  }

  return result;
}
