import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { Commentaires, DetailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface ChantierRepository {
  getById(id: string): Promise<Chantier>;
  getListe(): Promise<Chantier[]>;
  getInfosChantier(chantierId: string, maille: string, codeInsee: CodeInsee): Promise<InfosChantier>
}

export type InfosChantier = {
  synthèseDesRésultats: DetailsCommentaire | null
  météo: Météo | null
  commentaires: Commentaires
};
