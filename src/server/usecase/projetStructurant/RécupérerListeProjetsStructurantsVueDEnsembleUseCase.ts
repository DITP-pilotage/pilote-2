import { projet_structurant as ProjetStructurantPrisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import {
  ProjetStructurantVueDEnsemble,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { générerPeutÊtreNull } from '@/server/infrastructure/test/builders/utils';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export default class RécupérerListeProjetsStructurantsVueDEnsembleUseCase {
  constructor(
    private readonly projetStructurantrepository: ProjetStructurantRepository = dependencies.getProjetStructurantRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
    private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository = dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ) {}

  private construireListeProjetsStructurants(
    projetsStructurantsPrisma: ProjetStructurantPrisma[],
    territoires: Territoire[],
    météos: { projetStructurantId: string, météo: Météo }[],
  ) {
    return projetsStructurantsPrisma.map(projetStructurantPrisma => {
      const territoire = territoires.find(t => t.code === projetStructurantPrisma.territoire_code);

      if (!territoire)
        return null;

      return {
        id: projetStructurantPrisma.id,
        nom: projetStructurantPrisma.nom,
        // en attendant d'avoir les tables
        avancement: générerPeutÊtreNull(0.1, faker.datatype.number({ min: 0, max: 120, precision: 0.01 })),
        dateAvancement: faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString(),
        météo: météos.find(météo => météo.projetStructurantId === projetStructurantPrisma.id)?.météo ?? 'NON_RENSEIGNEE',
        maille: territoire.maille as MailleInterne,
        codeInsee: territoire.codeInsee,
        territoireNomÀAfficher: territoire.nomAffiché,
        périmètresIds: projetStructurantPrisma.perimetres_ids,
      };
    }).filter((ps): ps is ProjetStructurantVueDEnsemble => ps !== null);
  }

  async run(): Promise<ProjetStructurantVueDEnsemble[]> {
    const projetsStructurants = await this.projetStructurantrepository.récupérerListe();
    const territoires = await this.territoireRepository.récupérerListe(projetsStructurants.map(projet => projet.territoire_code));
    const météos = await this.synthèseDesRésultatsRepository.récupérerToutesLesMétéosLesPlusRécentes();

    return this.construireListeProjetsStructurants(projetsStructurants, territoires, météos);
  }
}
