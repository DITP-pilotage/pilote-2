import { projet_structurant as ProjetStructurantPrisma, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import RécupérerDétailsTerritoireUseCase from '@/server/usecase/territoire/RécupérerDétailsTerritoireUseCase';
import { générerPeutÊtreNull } from '@/server/infrastructure/test/builders/utils';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

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

  private async _mapperVersDomaine(projetStructurantPrisma: ProjetStructurantPrisma): Promise<ProjetStructurant> {
    const territoire = await this._récupérerTerritoireAssocié(projetStructurantPrisma);
    const périmètres = await this._récupérerPérimètresAssociés(projetStructurantPrisma.perimetres_ids);

    return {
      id: projetStructurantPrisma.id,
      nom: projetStructurantPrisma.nom,
      codeTerritoire: projetStructurantPrisma.territoire_code,
      // en attendant d'avoir les tables
      avancement: générerPeutÊtreNull(0.1, faker.datatype.number({ min: 0, max: 120, precision: 0.01 })),
      dateAvancement: faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString(),
      météo: new MétéoBuilder().build(),
      maille: territoire.maille as MailleInterne,
      codeInsee: territoire.codeInsee,
      territoireNomÀAfficher: territoire.nomAffiché,
      périmètresIds: projetStructurantPrisma.perimetres_ids,
      responsables: {
        ministèrePorteur: périmètres[0].ministèreNom,
        ministèresCoporteurs: périmètres.slice(1).map(p => p.ministèreNom),
        directionAdmininstration: projetStructurantPrisma.direction_administration,
        chefferieDeProjet: projetStructurantPrisma.chefferie_de_projet,
        coporteurs: projetStructurantPrisma.co_porteurs,
      },
    };
  }

  private async _récupérerTerritoireAssocié(projetStructurant: ProjetStructurantPrisma): Promise<Territoire> {
    return new RécupérerDétailsTerritoireUseCase().run(projetStructurant.territoire_code);
  }

  private async _récupérerPérimètresAssociés(périmètresIds: string[]): Promise<PérimètreMinistériel[]> {
    const périmètreMinistérielRepository = dependencies.getPérimètreMinistérielRepository();
    return Promise.all(périmètresIds.map(async périmètreId => périmètreMinistérielRepository.récupérer(périmètreId)));    
  }


  async récupérer(id: string): Promise<ProjetStructurantPrisma> {
    const projetStructurant = await this.prisma.projet_structurant.findFirst({
      where: { id  },
    });

    if (!projetStructurant) throw new ErreurProjetStructurantNonTrouvé(id);

    return projetStructurant;
  }

  async récupérerListe(): Promise<ProjetStructurantPrisma[]> {
    return this.prisma.projet_structurant.findMany();    
  }
}
