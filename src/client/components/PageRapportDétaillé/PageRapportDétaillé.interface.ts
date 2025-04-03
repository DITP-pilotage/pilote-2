import Chantier from '@/server/chantiers/domain/Chantier.interface';
import DécisionStratégique from '@/server/chantiers/domain/DecisionStrategique.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Commentaire } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Objectif from '@/server/domain/chantier/objectif/Objectif.interface';

export type PublicationsGroupéesParChantier = {
  commentaires: Record<Chantier['id'], Commentaire[]>
  décisionStratégique: Record<Chantier['id'], DécisionStratégique>
  objectifs: Record<Chantier['id'], Objectif[]>
  synthèsesDesRésultats: Record<Chantier['id'], SynthèseDesRésultats>
};

