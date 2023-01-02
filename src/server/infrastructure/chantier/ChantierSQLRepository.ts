import { chantier, PrismaClient } from '@prisma/client';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

///
// Fonctions utilitaires

function coerceNull<T>(value: T) {
  if (value == undefined) {
    return null;
  }
  return value;
}

function mapToDomain(chantierPrisma: chantier): Chantier {
  return {
    id: chantierPrisma.id,
    nom: chantierPrisma.nom,
    axe: null,
    nomPPG: null,
    id_périmètre: chantierPrisma.id_perimetre,
    périmètreIds: chantierPrisma.perimetre_ids,
    zoneNom: chantierPrisma.zone_nom,
    codeInsee: chantierPrisma.code_insee,
    maille: chantierPrisma.maille,
    météo: null,
    avancement: {
      annuel: null,
      global: { minimum: null, médiane: null, maximum: null, moyenne: chantierPrisma.taux_avancement },
    },
    indicateurs: [],
  };
}

function mapToPrisma(chantierDomaine: Chantier): chantier {
  return {
    id: chantierDomaine.id,
    nom: chantierDomaine.nom,
    id_perimetre: chantierDomaine.id_périmètre,
    perimetre_ids: chantierDomaine.périmètreIds,
    zone_nom: chantierDomaine.zoneNom,
    code_insee: chantierDomaine.codeInsee,
    taux_avancement: coerceNull(chantierDomaine.avancement.global?.moyenne),
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

  async getById(id: string, zone_nom: string) {
    const chantierPrisma = await this.prisma.chantier.findUnique({
      where: { id_zone_nom: { id, zone_nom } },
    });
    if (!chantierPrisma) {
      throw new Error(`Erreur: Chantier '${id} - ${zone_nom}' non trouvé.`);
    }
    return mapToDomain(chantierPrisma);
  }
}
