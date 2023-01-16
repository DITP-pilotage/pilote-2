import { chantier, PrismaClient } from '@prisma/client';
import Chantier, { Maille } from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';
import { météoFromString } from '@/server/domain/chantier/Météo.interface';

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
  const chantierNational = chantiers.find(c => c.maille === 'NAT');

  if (!chantierNational) {
    throw new ErreurChantierSansMailleNationale(chantiers[0].id);
  }

  const chantiersNonNationales = chantiers.filter(c => c.maille !== 'NAT');
    
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
    directeurAdministrationCentrale: chantierNational.directeurs_administration_centrale,
    ministères: chantierNational.ministeres,
  };

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
