import { Maille } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export type ChantierPourExport = {
  nom: string | null,
  maille: Maille | null,
  régionNom: string | null,
  départementNom: string | null,
  ministèreNom: string | null,
  tauxDAvancementNational: number | null,
  tauxDAvancementRégional: number | null,
  tauxDAvancementDépartemental: number | null,
  météo: Météo | null,
  estBaromètre: boolean | null,
  estTerritorialisé: boolean | null,
  commActionsÀVenir: string | null,
  commActionsÀValoriser: string | null,
  commFreinsÀLever: string | null,
  commCommentairesSurLesDonnées: string | null,
  commAutresRésultats: string | null,
  commAutresRésultatsNonCorrélésAuxIndicateurs: string | null,
  decStratSuiviDesDécisions: string | null,
  objNotreAmbition: string | null,
  objDéjàFait: string | null,
  objÀFaire: string | null,
  synthèseDesRésultats: string | null,
};