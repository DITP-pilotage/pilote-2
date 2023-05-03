import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import DécisionStratégique from '@/server/domain/décisionStratégique/DécisionStratégique.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { CommentaireTypé } from '@/server/usecase/commentaire/RécupérerCommentairesLesPlusRécentsParTypeUseCase';
import { ObjectifTypé } from '@/server/usecase/objectif/RécupérerObjectifsLesPlusRécentsParTypeUseCase';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type PublicationsGroupéesParChantier = {
  commentaires: Record<Chantier['id'], CommentaireTypé[]>
  décisionStratégique: Record<Chantier['id'], DécisionStratégique>
  objectifs: Record<Chantier['id'], ObjectifTypé[]>
  synthèsesDesRésultats: Record<Chantier['id'], SynthèseDesRésultats>
};

export default interface PageRapportDétailléProps {
  chantiers: Chantier[]
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<Chantier['id'], DétailsIndicateurs>
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier
  maille: Maille
  codeInsee: CodeInsee
}
