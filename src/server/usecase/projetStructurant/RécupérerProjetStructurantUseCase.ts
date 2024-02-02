import ProjetStructurant, {
  ProjetStructurantPrismaVersDomaine,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import SynthèseDesRésultatsProjetStructurantRepository
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';

export default class RécupérerProjetStructurantUseCase {
  constructor(
    private readonly projetStructurantrepository: ProjetStructurantRepository,
    private readonly territoireRepository: TerritoireRepository,
    private readonly ministèreRepository: MinistèreRepository,
    private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository,
  ) {}

  async run(projetStructurantId: string, habilitations: Habilitations): Promise<ProjetStructurant> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId);
    
    const projetStructurant = await this.projetStructurantrepository.récupérer(projetStructurantId);
    const territoire = await this.territoireRepository.récupérer(projetStructurant.territoireCode);
    const nomsMinistères = await this.ministèreRepository.récupérerLesNomsAssociésÀLeurPérimètre(projetStructurant.périmètresIds);
    const syntèseDesRésultats = await this.synthèseDesRésultatsRepository.récupérerLaPlusRécente(projetStructurant.id);

    return this.construireProjetStructurant(projetStructurant, territoire, nomsMinistères, syntèseDesRésultats?.météo ?? 'NON_RENSEIGNEE');
  }

  private construireProjetStructurant(projetStructurant: ProjetStructurantPrismaVersDomaine, territoire: Territoire, nomsMinistères: { perimetre_id: string, nom: string }[], météo: Météo): ProjetStructurant {
    const périmètrePorteur = projetStructurant.périmètresIds[0];
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
        ministèrePorteur: nomsMinistères.find(min => min.perimetre_id === périmètrePorteur)?.nom ?? 'Non Renseigné',
        ministèresCoporteurs: nomsMinistères.filter(min => min.perimetre_id !== périmètrePorteur).map(min => min.nom) ?? [],
        directionAdmininstration: projetStructurant.directionAdmininstration,
        chefferieDeProjet: projetStructurant.chefferieDeProjet,
        coporteurs: projetStructurant.coporteurs,
      },
    };
  }
}
