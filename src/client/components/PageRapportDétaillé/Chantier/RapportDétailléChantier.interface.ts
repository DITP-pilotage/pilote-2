import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { CommentaireTypé } from '@/server/usecase/commentaire/RécupérerCommentairesLesPlusRécentsParTypeUseCase';
import { ObjectifTypé } from '@/server/usecase/objectif/RécupérerObjectifsLesPlusRécentsParTypeUseCase';
import DécisionStratégique from '@/server/domain/décisionStratégique/DécisionStratégique.interface';

export default interface RapportDétailléChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  synthèseDesRésultats: SynthèseDesRésultats
  commentaires: CommentaireTypé[]
  objectifs: ObjectifTypé[]
  décisionStratégique: DécisionStratégique
}
