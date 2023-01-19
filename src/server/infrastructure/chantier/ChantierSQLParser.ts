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

export function parseChantier(chantiers: chantier[]): Chantier {
  const chantierNational = chantiers.find(c => c.maille === 'NAT');

  if (!chantierNational) {
    throw new ErreurChantierSansMailleNationale(chantiers[0].id);
  }

  const result: Chantier = {
    id: chantierNational.id,
    nom: chantierNational.nom,
    axe: null,
    nomPPG: null,
    périmètreIds: chantierNational.perimetre_ids,
    mailles: {
      nationale: {
        FR: {
          codeInsee: chantierNational.code_insee,
          avancement: { annuel: null, global: chantierNational.taux_avancement },
          météo: météoFromString(chantierNational.meteo),
        },
      },
      départementale: {},
      régionale: {},
    },
    responsables: {
      porteur: chantierNational.ministeres[0],
      coporteurs: chantierNational.ministeres.slice(1),
      directeursAdminCentrale: [],
      directeursProjet: [],
    },
  };

  if (chantierNational.directeurs_administration_centrale) {
    const directeurs = chantierNational.directeurs_administration_centrale;
    const directions = chantierNational.directions_administration_centrale;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursAdminCentrale.push({ nom: directeur, direction: directions[i] });
    }
  }

  if (chantierNational.directeurs_projet && chantierNational.directeurs_projet.length > 0) {
    const directeurs = chantierNational.directeurs_projet;
    const emails = chantierNational.directeurs_projet_mails;
    for (const [i, directeur] of directeurs.entries()) {
      result.responsables.directeursProjet.push({ nom: directeur, email: emails[i] });
    }
  }

  ///
  // Lignes à une maille non nationale
  const chantiersNonNationales = chantiers.filter(c => c.maille !== 'NAT');

  for (const chantierNonNational of chantiersNonNationales) {
    const nomDeMaille = NOMS_MAILLES[chantierNonNational.maille];
    if (!nomDeMaille) {
      throw new ErreurMailleChantierInconnue(chantierNational.id, chantierNonNational.maille);
    }
    result.mailles[nomDeMaille] = {
      ...result.mailles[nomDeMaille],
      [chantierNonNational.code_insee]: {
        codeInsee: chantierNonNational.code_insee,
        avancement: { annuel: null, global: chantierNonNational.taux_avancement },
        météo: météoFromString(chantierNonNational.meteo),
      },
    };
  }

  return result;
}
