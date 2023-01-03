import { chantier, PrismaClient } from '@prisma/client';
import Chantier from '@/server/domain/chantier/Chantier.interface';
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
    zoneNom: chantierPrisma.zone_nom,
    codeInsee: chantierPrisma.code_insee,
    maille: chantierPrisma.maille,
    météo: null,
    avancement: {
      annuel: null,
      global: chantierPrisma.taux_avancement,
    },
    indicateurs: [],
  };
}

function mapToPrisma(chantierDomaine: Chantier): chantier {
  return {
    id: chantierDomaine.id,
    nom: chantierDomaine.nom,
    id_perimetre: 'deleteme',
    perimetre_ids: chantierDomaine.périmètreIds,
    zone_nom: chantierDomaine.zoneNom,
    code_insee: chantierDomaine.codeInsee,
    taux_avancement: chantierDomaine.avancement.global,
    maille: chantierDomaine.maille,
  };
}

///
// Implémentation du Repository

export default class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async add(chantierToAdd: Chantier) {
    await this.prisma.chantier.create({
      data: mapToPrisma(chantierToAdd),
    });
  }

  async getById(id: string, code_insee: string, maille: string) {
    const chantierPrisma = await this.prisma.chantier.findUnique({
      where: { id_code_insee_maille: { id, code_insee, maille } },
    });
    if (!chantierPrisma) {
      throw new Error(`Erreur: Chantier '${id} - ${code_insee} - ${maille}' non trouvé.`);
    }
    return mapToDomain(chantierPrisma);
  }
}
