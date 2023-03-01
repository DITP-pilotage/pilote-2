import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { Commentaires, DetailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface ChantierRepository {
  getById(id: string): Promise<Chantier>;
  getListe(): Promise<Chantier[]>;
  getMétriques(chantierId: string, maille: string, codeInsee: CodeInsee): Promise<MetriquesChantier>
}

export type MetriquesChantier = {
  synthèseDesRésultats: DetailsCommentaire
  météo: Météo | null
  commentaires: Commentaires
};
