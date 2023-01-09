import { chantier, PrismaClient } from '@prisma/client';
import Chantier, { Maille } from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';

///
// Fonctions utilitaires

const CODES_MAILLES: Record<Maille, string> = {
  nationale: 'NAT',
  départementale: 'DEPT',
  régionale: 'REG',
};

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
    directeurProjet: chantierNationale.directeur_projet,
    directeurAdministrationCentrale: chantierNationale.directeurs_administration_centrale,
    ministères: chantierNationale.ministeres,
    indicateurs: [],
  };

  for (const chantierNonNational of chantiersNonNationales) {
    const maille = NOMS_MAILLES[chantierNonNational.maille];

    // TODO : lancer une erreur si maille non existante
    result.mailles[maille] = {
      ...result.mailles[maille], 
      [chantierNonNational.code_insee]: {
        codeInsee: chantierNonNational.code_insee,
        avancement: { annuel: null, global: chantierNonNational.taux_avancement },
      },
    };
  }

  return result;
}

function mapToPrismaRows(chantierDomaine: Chantier): chantier[] {
  const result: chantier[] = [];

  Object.entries(chantierDomaine.mailles).forEach(([nomDeMaille, territoire]) => {
    const codeMaille = CODES_MAILLES[nomDeMaille as Maille];

    Object.values(territoire).forEach(donnéesTerritoire => {
      result.push({
        id: chantierDomaine.id,
        nom: chantierDomaine.nom,
        perimetre_ids: chantierDomaine.périmètreIds,
        territoire_nom: 'TBD',
        code_insee: donnéesTerritoire.codeInsee,
        taux_avancement: donnéesTerritoire.avancement.global,
        maille: codeMaille,
        directeur_projet: chantierDomaine.directeurProjet,
        directeurs_administration_centrale: chantierDomaine.directeurAdministrationCentrale,
        ministeres: chantierDomaine.ministères,
      });
    });
  });

  return result;
}

///
// Implémentation du Repository

export default class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async add(chantierToAdd: Chantier) {
    const rows: chantier[] = mapToPrismaRows(chantierToAdd);
    for (const row of rows) {
      await this.prisma.chantier.create({
        data: row,
      });
    }
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
