import { DétailsCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export interface SynthèseRésultatsProps {
  météo: Météo
  synthèseDesRésultats: DétailsCommentaire | null
}
