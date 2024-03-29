import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import DécisionStratégique from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import { Commentaire } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Objectif from '@/server/domain/chantier/objectif/Objectif.interface';

export default interface RapportDétailléChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  synthèseDesRésultats: SynthèseDesRésultats
  commentaires: Commentaire[]
  objectifs: Objectif[]
  décisionStratégique: DécisionStratégique
}
