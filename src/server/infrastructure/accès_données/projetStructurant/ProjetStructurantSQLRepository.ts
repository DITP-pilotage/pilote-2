import { projet_structurant as ProjetStructurantPrisma, PrismaClient } from '@prisma/client';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import { ProjetStructurantPrismaVersDomaine } from '@/server/domain/projetStructurant/ProjetStructurant.interface';

class ErreurProjetStructurantNonTrouvé extends Error {
  constructor(id: string) {
    super(`Erreur: projet structurant '${id}' non trouvé.`);
  }
}

export default class ProjetStructurantSQLRepository implements ProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private _mapperVersDomaine(projetStructurantPrisma: ProjetStructurantPrisma): ProjetStructurantPrismaVersDomaine {    
    return {
      id: projetStructurantPrisma.id,
      nom: projetStructurantPrisma.nom,
      territoireCode: projetStructurantPrisma.territoire_code,
      périmètresIds: projetStructurantPrisma.perimetres_ids,
      avancement: projetStructurantPrisma.taux_avancement,
      dateAvancement: projetStructurantPrisma.date_taux_avancement ? projetStructurantPrisma.date_taux_avancement.toISOString() : null,
      directionAdmininstration: projetStructurantPrisma.direction_administration,
      chefferieDeProjet: projetStructurantPrisma.chefferie_de_projet,
      coporteurs: projetStructurantPrisma.co_porteurs,
    };
  }

  async récupérer(id: string) {
    const projetStructurant = await this.prisma.projet_structurant.findFirst({
      where: { id  },
    });

    if (!projetStructurant) throw new ErreurProjetStructurantNonTrouvé(id);

    return this._mapperVersDomaine(projetStructurant);
  }

  async récupérerListe() {
    const projetsStructurants = await this.prisma.projet_structurant.findMany();
    return projetsStructurants.map(p => this._mapperVersDomaine(p));   
  }
}
