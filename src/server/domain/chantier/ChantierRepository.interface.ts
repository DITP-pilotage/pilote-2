import Chantier from '@/server/domain/chantier/Chantier.interface';
import Habilitations from '@/server/domain/identité/Habilitations';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { Commentaires, DétailsCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export default interface ChantierRepository {
  getById(id: string): Promise<Chantier>;
  getListe(habilitations: Habilitations): Promise<Chantier[]>;
  récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null>
}

export type InfosChantier = {
  synthèseDesRésultats: DétailsCommentaire | null
  météo: Météo | null
  commentaires: Commentaires
};
