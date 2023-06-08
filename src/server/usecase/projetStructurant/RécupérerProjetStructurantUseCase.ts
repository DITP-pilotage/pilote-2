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
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class RécupérerProjetStructurantUseCase {
  constructor(
    private readonly projetStructurantrepository: ProjetStructurantRepository = dependencies.getProjetStructurantRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
    private readonly périmètreMinistérielRepository: PérimètreMinistérielRepository = dependencies.getPérimètreMinistérielRepository(),
    private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository = dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ) {}

  private construireProjetStructurant(projetStructurantPrisma: ProjetStructurantPrisma, territoire: Territoire, périmètres: PérimètreMinistériel[], météo: Météo): ProjetStructurant {
    const ministèresNoms = [...new Set(périmètres.map(p => p.ministèreNom))];

    return {
      id: projetStructurantPrisma.id,
      nom: projetStructurantPrisma.nom,
      // en attendant d'avoir les tables
      avancement: générerPeutÊtreNull(0.1, faker.datatype.number({ min: 0, max: 120, precision: 0.01 })),
      dateAvancement: faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString(),
      météo: météo,
      périmètresIds: projetStructurantPrisma.perimetres_ids,
      territoire: {
        code: projetStructurantPrisma.territoire_code,
        maille: territoire.maille as MailleInterne,
        codeInsee: territoire.codeInsee,
        nomAffiché: territoire.nomAffiché,
      },
      responsables: {
        ministèrePorteur: ministèresNoms[0] ?? '',
        ministèresCoporteurs: ministèresNoms.slice(1) ?? [],
        directionAdmininstration: projetStructurantPrisma.direction_administration,
        chefferieDeProjet: projetStructurantPrisma.chefferie_de_projet,
        coporteurs: projetStructurantPrisma.co_porteurs,
      },
    };
  }

  async run(projetStructurantId: string, habilitations: Habilitations): Promise<ProjetStructurant> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId);
    
    const projetStructurant = await this.projetStructurantrepository.récupérer(projetStructurantId);
    const territoire = await this.territoireRepository.récupérer(projetStructurant.territoire_code);
    const périmètres = await this.périmètreMinistérielRepository.récupérerListe(projetStructurant.perimetres_ids);
    const syntèseDesRésultats = await this.synthèseDesRésultatsRepository.récupérerLaPlusRécente(projetStructurant.id);

    return this.construireProjetStructurant(projetStructurant, territoire, périmètres, syntèseDesRésultats?.météo ?? 'NON_RENSEIGNEE');
  }
}
