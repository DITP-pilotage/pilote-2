import Chantier from '@/server/domain/chantier/Chantier.interface';
import DécisionStratégique from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Commentaire } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Objectif from '@/server/domain/chantier/objectif/Objectif.interface';

export type PublicationsGroupéesParChantier = {
  commentaires: Record<Chantier['id'], Commentaire[]>
  décisionStratégique: Record<Chantier['id'], DécisionStratégique>
  objectifs: Record<Chantier['id'], Objectif[]>
  synthèsesDesRésultats: Record<Chantier['id'], SynthèseDesRésultats>
};

