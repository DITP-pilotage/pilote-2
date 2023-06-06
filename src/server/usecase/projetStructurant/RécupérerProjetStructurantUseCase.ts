import ProjetStructurant, { ProjetStructurantPrismaVersDomaine } from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
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

  private construireProjetStructurant(projetStructurant: ProjetStructurantPrismaVersDomaine, territoire: Territoire, périmètres: PérimètreMinistériel[], météo: Météo): ProjetStructurant {
    const ministèresNoms = [...new Set(périmètres.map(p => p.ministèreNom))];

    return {
      id: projetStructurant.id,
      nom: projetStructurant.nom,
      avancement: projetStructurant.avancement,
      dateAvancement: projetStructurant.dateAvancement,
      météo: météo,
      périmètresIds: projetStructurant.périmètresIds,
      territoire: {
        code: projetStructurant.territoireCode,
        maille: territoire.maille as MailleInterne,
        codeInsee: territoire.codeInsee,
        nomAffiché: territoire.nomAffiché,
      },
      responsables: {
        ministèrePorteur: ministèresNoms[0] ?? '',
        ministèresCoporteurs: ministèresNoms.slice(1) ?? [],
        directionAdmininstration: projetStructurant.directionAdmininstration,
        chefferieDeProjet: projetStructurant.chefferieDeProjet,
        coporteurs: projetStructurant.coporteurs,
      },
    };
  }

  async run(projetStructurantId: string, habilitations: Habilitations): Promise<ProjetStructurant> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId);
    
    const projetStructurant = await this.projetStructurantrepository.récupérer(projetStructurantId);
    const territoire = await this.territoireRepository.récupérer(projetStructurant.territoireCode);
    const périmètres = await this.périmètreMinistérielRepository.récupérerListe(projetStructurant.périmètresIds);
    const syntèseDesRésultats = await this.synthèseDesRésultatsRepository.récupérerLaPlusRécente(projetStructurant.id);

    return this.construireProjetStructurant(projetStructurant, territoire, périmètres, syntèseDesRésultats?.météo ?? 'NON_RENSEIGNEE');
  }
}
