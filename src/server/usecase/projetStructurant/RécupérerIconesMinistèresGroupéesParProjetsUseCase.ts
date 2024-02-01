import Ministère from '@/server/domain/ministère/Ministère.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import ProjetStructurant, {
  ProjetStructurantPrismaVersDomaine,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default class RécupérerIconesMinistèresGroupéesParProjetsUseCase {
  constructor(
    private readonly ministèreRepository: MinistèreRepository,
  ) {}

  async run(projetsStructurants: ProjetStructurantPrismaVersDomaine[]): Promise<Record<ProjetStructurant['id'], Ministère['icône'][]>> {
    const iconeParPérimètre = await this.ministèreRepository.récupérerToutesLesIconesAssociéesÀLeurPérimètre();
    const résultat: Record<ProjetStructurant['id'], Ministère['icône'][]> = {};

    projetsStructurants.forEach(projet => {
      const iconesAssociées: Ministère['icône'][] = [];
      iconeParPérimètre.forEach(icone => {        
        if (projet.périmètresIds.includes(icone.perimetre_id)) {
          iconesAssociées.push(icone.icone);
        }
      });

      résultat[projet.id] = [...new Set(iconesAssociées)];
    });

    return résultat;
  }
}
