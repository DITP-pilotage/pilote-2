import { projet_structurant as ProjetStructurantPrisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { générerPeutÊtreNull } from '@/server/infrastructure/test/builders/utils';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export default class RécupérerListeProjetsStructurantsUseCase {
  constructor(
    private readonly projetStructurantrepository: ProjetStructurantRepository = dependencies.getProjetStructurantRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
    private readonly périmètreMinistérielRepository: PérimètreMinistérielRepository = dependencies.getPérimètreMinistérielRepository(),
    private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository = dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ) {}

  private construireProjetsStructurants(projetsStructurantsPrisma: ProjetStructurantPrisma[], territoires: Territoire[], périmètres: PérimètreMinistériel[], météos: { projetStructurantId: string, météo: Météo }[]) {
    return projetsStructurantsPrisma.map(projetStructurantPrisma => (
      {
        id: projetStructurantPrisma.id,
        nom: projetStructurantPrisma.nom,
        codeTerritoire: projetStructurantPrisma.territoire_code,
        // en attendant d'avoir les tables
        avancement: générerPeutÊtreNull(0.1, faker.datatype.number({ min: 0, max: 120, precision: 0.01 })),
        dateAvancement: faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString(),
        météo: météos.find(météo => météo.p),
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
      }
    ));
  }

  async run(): Promise<ProjetStructurant> {
    const projetsStructurants = await this.projetStructurantrepository.récupérerListe();
    const territoires = await this.territoireRepository.récupérerListe(projetsStructurants.map(projet => projet.territoire_code));
    const périmètres = await this.périmètreMinistérielRepository.récupérerTous();
    const météos = await this.synthèseDesRésultatsRepository.récupérerToutesLesMétéosLesPlusRécentes();
    

    return this.construireProjetsStructurants(projetsStructurants, territoires, périmètres, météos);
  }
}
