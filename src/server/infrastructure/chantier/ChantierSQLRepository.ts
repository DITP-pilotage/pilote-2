import { chantier, PrismaClient } from '@prisma/client';
import Chantier, { Maille } from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';

///
// Fonctions utilitaires

const NOMS_MAILLES: Record<string, Maille> = {
  NAT: 'nationale',
  DEPT: 'départementale',
  REG: 'régionale',
};

class ErreurChantierNonTrouvé extends Error {
  constructor(idChantier: string) {
    super(`Erreur: chantier '${idChantier}' non trouvé.`);
  }
}

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

function mapToDomain(chantiers: chantier[]): Chantier {
  const chantierNationale = chantiers.find(c => c.maille === 'NAT');

  if (!chantierNationale) {
    throw new ErreurChantierSansMailleNationale(chantiers[0].id);
  }

  const chantiersNonNationales = chantiers.filter(c => c.maille !== 'NAT');
    
  const result: Chantier = {
    id: chantierNationale.id,
    nom: chantierNationale.nom,
    axe: null,
    nomPPG: null,
    périmètreIds: chantierNationale.perimetre_ids,
    météo: null,
    mailles: {
      nationale: {
        FR: {
          codeInsee: chantierNationale.code_insee,
          avancement: { annuel: null, global: chantierNationale.taux_avancement },
        },
      },
      départementale: {},
      régionale: {},
    },
    directeurAdministrationCentrale: chantierNationale.directeurs_administration_centrale,
    ministères: chantierNationale.ministeres,
  };

  for (const chantierNonNational of chantiersNonNationales) {
    const nomDeMaille = NOMS_MAILLES[chantierNonNational.maille];
    if (!nomDeMaille) {
      throw new ErreurMailleChantierInconnue(chantierNationale.id, chantierNonNational.maille);
    }
    result.mailles[nomDeMaille] = {
      ...result.mailles[nomDeMaille],
      [chantierNonNational.code_insee]: {
        codeInsee: chantierNonNational.code_insee,
        avancement: { annuel: null, global: chantierNonNational.taux_avancement },
      },
    };
  }

  return result;
}

///
// Implémentation du Repository

export default class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getById(id: string) {
    const chantiers: chantier[] = await this.prisma.chantier.findMany({
      where: { id },
    });

    if (!chantiers || chantiers.length === 0) {
      throw new ErreurChantierNonTrouvé(id);
    }

    return mapToDomain(chantiers);
  }

  async getListe() {
    const chantiers = await this.prisma.chantier.findMany();
    const chantiersGroupésParId = groupBy<chantier>(chantiers, c => c.id);

    return Object.entries(chantiersGroupésParId).map(([_, c]) => mapToDomain(c));
  }
}
