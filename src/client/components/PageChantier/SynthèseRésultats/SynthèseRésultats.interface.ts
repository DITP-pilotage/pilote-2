import { DetailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export interface SynthèseRésultatsProps {
  météo: Météo
  synthèseDesRésultats: DetailsCommentaire | null
}
