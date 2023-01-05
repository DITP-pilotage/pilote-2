import { chantier, PrismaClient } from '@prisma/client';
import Chantier, { Maille } from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

///
// Fonctions utilitaires

function mapToDomain(chantierPrisma: chantier): Chantier {
  return {
    id: chantierPrisma.id,
    nom: chantierPrisma.nom,
    axe: null,
    nomPPG: null,
    périmètreIds: chantierPrisma.perimetre_ids,
    météo: null,
    mailles: {
      nationale: {
        FR: {
          codeInsee: chantierPrisma.code_insee,
          avancement: { annuel: null, global: chantierPrisma.taux_avancement },
        },
      },
    },
    avancement: {
      annuel: null,
      global: chantierPrisma.taux_avancement,
    },
    indicateurs: [],
  };
}

const MAILLES_CODES = {
  nationale: 'NAT',
  départementale: 'DEPT',
  régionale: 'REG',
};

function mapToPrismaRows(chantierDomaine: Chantier): chantier[] {
  const result: chantier[] = [];
  for (const nomDeMaille in chantierDomaine.mailles) {
    // @ts-ignore
    const maille: Maille = chantierDomaine.mailles[nomDeMaille];
    // @ts-ignore
    const codeMaille = MAILLES_CODES[nomDeMaille];
    for (const codeInsee in maille) {
      result.push({
        id: chantierDomaine.id,
        nom: chantierDomaine.nom,
        id_perimetre: 'deleteme',
        perimetre_ids: chantierDomaine.périmètreIds,
        zone_nom: 'TBD',
        code_insee: codeInsee,
        taux_avancement: chantierDomaine.mailles.nationale.FR.avancement.global,
        maille: codeMaille,
      });
    }
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

  async add(chantierToAdd: Chantier) {
    const rows: chantier[] = mapToPrismaRows(chantierToAdd);
    for (const row of rows) {
      await this.prisma.chantier.create({
        data: row,
      });
    }
  }

  async getById(id: string) {
    const chantierPrisma = await this.prisma.chantier.findUnique({
      where: { id_code_insee_maille: { id, code_insee: 'FR', maille: 'NAT' } },
    });
    if (!chantierPrisma) {
      throw new Error(`Erreur: Chantier '${id} - FR - NAT' non trouvé.`);
    }
    return mapToDomain(chantierPrisma);
  }
}
