import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import DécisionStratégique from '@/server/domain/décisionStratégique/DécisionStratégique.interface';
import { Objectifs } from '@/server/domain/objectif/Objectif.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { CommentaireTypé } from '@/server/usecase/commentaire/RécupérerCommentairesLesPlusRécentsParTypeUseCase';

export type PublicationsGroupéesParChantier = {
  commentaires: Record<Chantier['id'], CommentaireTypé[]>
  décisionsStratégiques: Record<Chantier['id'], DécisionStratégique>
  objectifs: Record<Chantier['id'], Objectifs>
  synthèsesDesRésultats: Record<Chantier['id'], SynthèseDesRésultats>
};

export default interface PageRapportDétailléProps {
  chantiers: Chantier[]
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<Chantier['id'], DétailsIndicateurs>
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier
}
