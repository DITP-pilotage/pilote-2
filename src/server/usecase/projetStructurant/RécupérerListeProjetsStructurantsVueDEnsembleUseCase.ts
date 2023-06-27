import {
  ProjetStructurantPrismaVersDomaine,
  ProjetStructurantVueDEnsemble,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import RécupérerIconesMinistèresGroupéesParProjets from './RécupérerIconesMinistèresGroupéesParProjets';

export default class RécupérerListeProjetsStructurantsVueDEnsembleUseCase {
  constructor(
    private readonly projetStructurantrepository: ProjetStructurantRepository = dependencies.getProjetStructurantRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
    private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository = dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ) {}

  private construireListeProjetsStructurants(
    projetsStructurants: ProjetStructurantPrismaVersDomaine[],
    territoires: Territoire[],
    météos: { projetStructurantId: string, météo: Météo }[],
    iconesMinistères: Record<ProjetStructurantPrismaVersDomaine['id'], Ministère['icône'][]>,
  ): ProjetStructurantVueDEnsemble[] {
    return projetsStructurants.map(projetStructurant => {
      const territoire = territoires.find(t => t.code === projetStructurant.territoireCode);

      if (!territoire) return null;

      return {
        id: projetStructurant.id,
        nom: projetStructurant.nom,
        avancement: projetStructurant.avancement,
        dateAvancement: projetStructurant.dateAvancement,
        météo: météos.find(météo => météo.projetStructurantId === projetStructurant.id)?.météo ?? 'NON_RENSEIGNEE',
        maille: territoire.maille as MailleInterne,
        codeInsee: territoire.codeInsee,
        territoireNomÀAfficher: territoire.nomAffiché,
        périmètresIds: projetStructurant.périmètresIds,
        iconesMinistères: iconesMinistères[projetStructurant.id],
      };
    }).filter((ps): ps is ProjetStructurantVueDEnsemble => ps !== null);
  }
  

  async run(habilitations: Habilitations, profil: ProfilCode): Promise<ProjetStructurantVueDEnsemble[]> {
    const habilitation = new Habilitation(habilitations);
    const projetsStructurantsIdsAccessiblesEnLecture = habilitation.récupérerListeProjetsStructurantsIdsAccessiblesEnLecture();
    
    const projetsStructurants = await this.projetStructurantrepository.récupérerListe();
    let projetsStructurantsAccessibles = projetsStructurants.filter(ps => projetsStructurantsIdsAccessiblesEnLecture.includes(ps.id));
    const territoires = await this.territoireRepository.récupérerListe(projetsStructurantsAccessibles.map(projet => projet.territoireCode));
    const météos = await this.synthèseDesRésultatsRepository.récupérerToutesLesMétéosLesPlusRécentes();
    const iconesGroupéesParProjets = await new RécupérerIconesMinistèresGroupéesParProjets().run(projetsStructurants);    

    if (profil === 'DROM') {
      projetsStructurantsAccessibles = projetsStructurantsAccessibles.filter(ps => ps.périmètresIds.includes('PER-018'));
    }

    return this.construireListeProjetsStructurants(projetsStructurantsAccessibles, territoires, météos, iconesGroupéesParProjets);
  }
}
