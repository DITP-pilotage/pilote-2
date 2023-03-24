import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { Commentaires } from '@/server/domain/commentaire/Commentaire.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Habilitation from '../identité/Habilitation';

export default interface ChantierRepository {
  getById(id: string): Promise<Chantier>;
  getListe(habilitation: Habilitation, scope: string): Promise<Chantier[]>;
  récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null>
}

export type InfosChantier = {
  synthèseDesRésultats: SynthèseDesRésultats
  météo: Météo | null
  commentaires: Commentaires
};
