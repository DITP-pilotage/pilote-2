import { chantier, PrismaClient } from '@prisma/client';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';



function mapToDomain(chantierPrisma: chantier): Chantier {
  return {
    id: chantierPrisma.id,
    nom: chantierPrisma.nom,
    axe: null,
    nomPPG: null,
    id_périmètre: chantierPrisma.id_perimetre,
    perimètreIds: chantierPrisma.perimetre_ids,
    zoneNom: chantierPrisma.zone_nom,
    codeInsee: chantierPrisma.code_insee,
    tauxAvancement: chantierPrisma.taux_avancement,
    météo: null,
    avancement: { annuel: null, global: null },
    indicateurs: [],
  };
}

function mapToPrisma(chantierDomaine: Chantier): chantier {
  return {
    id: chantierDomaine.id,
    nom: chantierDomaine.nom,
    id_perimetre: chantierDomaine.id_périmètre,
    perimetre_ids: chantierDomaine.perimètreIds,
    zone_nom: chantierDomaine.zoneNom,
    code_insee: chantierDomaine.codeInsee,
    taux_avancement: chantierDomaine.tauxAvancement,
  };
}

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

  async getById(id: string) {
    const chantierPrisma = await this.prisma.chantier.findUnique({
      where: { id },
    });
    if (!chantierPrisma) {
      throw new Error(`Erreur: Chantier '${id}' non trouvé.`);
    }
    return mapToDomain(chantierPrisma);
  }
}
