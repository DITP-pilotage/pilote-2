// import { projet_structurant as ProjetStructurantPrisma, PrismaClient } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';

class ErreurProjetStructurantNonTrouvé extends Error {
  constructor(id: string) {
    super(`Erreur: projet structurant '${id}' non trouvé.`);
  }
}

// en attendant d'ajouter les ligne maille et code insee dans prisma
export type ProjetStructurantPrisma = {
  id: string;
  code: string;
  nom: string;
  maille: string;
  code_insee: string;
  direction_administration: string[];
  perimetres_ids: string[];
  chefferie_de_projet: string[];
  co_porteur: string[];
};

export default class ProjetStructurantSQLRepository implements ProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(projetStructurantPrisma: ProjetStructurantPrisma): ProjetStructurant {
    return {
      id: projetStructurantPrisma.id,
      nom: projetStructurantPrisma.nom,
      avancement: null,
      dateAvancement: Date.now().toString(),
      maille: projetStructurantPrisma.maille as MailleInterne,
      codeInsee: projetStructurantPrisma.code_insee,
      territoireNomÀAfficher: projetStructurantPrisma.maille === 'DEPT' ? `${projetStructurantPrisma.code_insee} - ${projetStructurantPrisma.nom}` : projetStructurantPrisma.nom,
      périmètresIds: projetStructurantPrisma.perimetres_ids,
      météo: 'NON_RENSEIGNEE',
      responsables: {
        //mapping périmètre ministère
        ministèrePorteur: '',
        ministèresCoporteurs: [],
        directionAdmininstration: projetStructurantPrisma.direction_administration,
        chefferieDeProjet: projetStructurantPrisma.chefferie_de_projet,
        coporteurs: projetStructurantPrisma.co_porteur,
      },
    };
  }


  async récupérer(id: string): Promise<ProjetStructurant> {
    const projetStructurant = await this.prisma.projet_structurant.findFirst({
      where: { id  },
    }) as unknown as ProjetStructurantPrisma;

    if (!projetStructurant) {
      throw new ErreurProjetStructurantNonTrouvé(id);
    }

    return this.mapperVersDomaine(projetStructurant);
  }

  async récupérerListe(): Promise<ProjetStructurant[]> {
    const projetsStructurants = await this.prisma.projet_structurant.findMany() as unknown as ProjetStructurantPrisma[];

    return projetsStructurants.map(projetStructurant => this.mapperVersDomaine(projetStructurant));
  }

}
