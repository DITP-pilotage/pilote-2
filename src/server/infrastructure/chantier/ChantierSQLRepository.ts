import { chantier, PrismaClient } from '@prisma/client';
import Chantier, { ajouteValeurDeMaille, NomDeMaille } from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

///
// Fonctions utilitaires

const CODES_MAILLES = {
  nationale: 'NAT',
  départementale: 'DEPT',
  régionale: 'REG',
};

const NOMS_MAILLES = {
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

function mapToDomain(rowNationale: chantier, rowsNonNationales: chantier[]): Chantier {
  const result: Chantier = {
    id: rowNationale.id,
    nom: rowNationale.nom,
    axe: null,
    nomPPG: null,
    périmètreIds: rowNationale.perimetre_ids,
    météo: null,
    mailles: {
      nationale: {
        FR: {
          codeInsee: rowNationale.code_insee,
          avancement: { annuel: null, global: rowNationale.taux_avancement },
        },
      },
      départementale: {},
      régionale: {},
    },
    avancement: {
      annuel: null,
      global: rowNationale.taux_avancement,
    },
    indicateurs: [],
  };

  for (const row of rowsNonNationales) {
    // @ts-ignore TODO: lancer une erreur
    const nomDeMaille = NOMS_MAILLES[row.maille];
    const valeurDeMaille = {
      codeInsee: row.code_insee,
      avancement: { annuel: null, global: row.taux_avancement },
    };
    ajouteValeurDeMaille(result, nomDeMaille, valeurDeMaille);
  }
  return result;
}

function mapToPrismaRows(chantierDomaine: Chantier): chantier[] {
  const result: chantier[] = [];
  Object.entries(chantierDomaine.mailles).forEach(([nomDeMaille, maille]) => {
    const codeMaille = CODES_MAILLES[nomDeMaille as NomDeMaille];
    Object.values(maille).forEach(valeurDeMaille => {
      result.push({
        id: chantierDomaine.id,
        nom: chantierDomaine.nom,
        id_perimetre: 'deleteme',
        perimetre_ids: chantierDomaine.périmètreIds,
        zone_nom: 'TBD',
        code_insee: valeurDeMaille.codeInsee,
        taux_avancement: valeurDeMaille.avancement.global,
        maille: codeMaille,
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
    const rows: chantier[] = await this.prisma.chantier.findMany({
      where: { id },
    });
    if (!rows || rows.length === 0) {
      throw new ErreurChantierNonTrouvé(id);
    }
    const rowNationale = rows.find(row => row.maille === 'NAT');
    if (!rowNationale) {
      throw new ErreurChantierSansMailleNationale(rows[0].id);
    }
    const rowsNonNationales = rows.filter(r => r.maille !== 'NAT');
    return mapToDomain(rowNationale, rowsNonNationales);
  }

  async getListe() {
    const allChantiersPrisma = await this.prisma.chantier.findMany();
    return allChantiersPrisma.filter(c => c.maille === 'NAT').map(chantierPrisma => mapToDomain(chantierPrisma, []));
  }
}
