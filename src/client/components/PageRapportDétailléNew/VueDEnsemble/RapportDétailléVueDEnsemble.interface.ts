import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
  RépartitionsMétéos,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

export default interface RapportDétailléVueDEnsembleProps {
  chantiers: ChantierRapportDetailleContrat[]
  filtresComptesCalculés: Record<string, { nombre: number }>
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat
  répartitionMétéos: RépartitionsMétéos
  territoireCode: string
}
