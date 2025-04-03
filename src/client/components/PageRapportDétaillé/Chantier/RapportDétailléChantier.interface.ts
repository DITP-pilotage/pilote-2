import { DétailsIndicateurs } from '@/server/chantiers/domain/DétailsIndicateur';
import Indicateur from '@/server/chantiers/domain/Indicateur';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import DécisionStratégique from '@/server/chantiers/domain/DecisionStrategique.interface';
import { Commentaire } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Objectif from '@/server/domain/chantier/objectif/Objectif.interface';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { AvancementChantierRapportDetaille } from '@/components/PageRapportDétaillé/AvancementChantierRapportDetaille';
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import {
  CartographieDonnéesMétéo,
} from '@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface';
import { MailleInterne } from '@/server/chantiers/domain/Maille';

export default interface RapportDétailléChantierProps {
  territoireSélectionné: DétailTerritoire,
  mailleSelectionnee: MailleInterne,
  mailleQuery: MailleInterne,
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
  jalon: number
  listeIndicateursPrisEnCompteAvancement: string[]
}
