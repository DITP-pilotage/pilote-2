import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import DécisionStratégique from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import { Commentaire } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Objectif from '@/server/domain/chantier/objectif/Objectif.interface';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import {
  AvancementChantierRapportDetaille,
} from '@/components/PageRapportDétailléNew/avancement-chantier-rapport-detaille';
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import {
  CartographieDonnéesMétéo,
} from '@/components/_commons/Cartographie/CartographieMétéoNew/CartographieMétéo.interface';

export default interface RapportDétailléChantierProps {
  territoireSélectionné: DétailTerritoire,
  mailleSélectionnée: 'départementale' | 'régionale',
  territoireCode: string,
  chantier: ChantierRapportDetailleContrat
  indicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  synthèseDesRésultats: SynthèseDesRésultats
  commentaires: Commentaire[]
  objectifs: Objectif[]
  décisionStratégique: DécisionStratégique
  mapChantierStatistiques: Map<string, AvancementChantierRapportDetaille>
  donnéesCartographieAvancement: AvancementsGlobauxTerritoriauxMoyensContrat
  donnéesCartographieMétéo: CartographieDonnéesMétéo
}
