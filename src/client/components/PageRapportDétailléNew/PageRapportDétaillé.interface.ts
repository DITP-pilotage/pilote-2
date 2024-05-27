import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import DécisionStratégique from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Commentaire } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Objectif from '@/server/domain/chantier/objectif/Objectif.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
  RépartitionsMétéos,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import Axe from '@/server/domain/axe/Axe.interface';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import {
  AvancementChantierRapportDetaille,
} from '@/components/PageRapportDétailléNew/avancement-chantier-rapport-detaille';
import {
  CartographieDonnéesMétéo,
} from '@/components/_commons/Cartographie/CartographieMétéoNew/CartographieMétéo.interface';

export type PublicationsGroupéesParChantier = {
  commentaires: Record<Chantier['id'], Commentaire[]>
  décisionStratégique: Record<Chantier['id'], DécisionStratégique>
  objectifs: Record<Chantier['id'], Objectif[]>
  synthèsesDesRésultats: Record<Chantier['id'], SynthèseDesRésultats>
};

export default interface PageRapportDétailléProps {
  chantiers: ChantierRapportDetailleContrat[]
  ministères: Ministère[]
  axes: Axe[],
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<Chantier['id'], DétailsIndicateurs>
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier
  mailleSélectionnée: 'départementale' | 'régionale'
  mapChantierStatistiques: Map<string, AvancementChantierRapportDetaille>
  codeInsee: CodeInsee
  territoireCode: string
  filtresComptesCalculés: Record<string, { nombre: number }>
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat
  répartitionMétéos: RépartitionsMétéos
  mapDonnéesCartographieAvancement: Map<string, AvancementsGlobauxTerritoriauxMoyensContrat>
  mapDonnéesCartographieMétéo:Map<string, CartographieDonnéesMétéo>
}
