import { Maille } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export class ChantierPourExport {
  constructor(
    public readonly nom: string | null,
    public readonly maille: Maille,
    public readonly codeRégion: string | null,
    public readonly codeDépartement: string | null,
    public readonly ministère: string | null,
    public readonly tauxDAvancementNational: number | null,
    public readonly tauxDAvancementRégional: number | null,
    public readonly tauxDAvancementDépartemental: number | null,
    public readonly météo: Météo,
    public readonly estBaromètre: boolean,
    public readonly estTerritorialisé: boolean,
    public readonly commActionsÀVenir: string | null,
    public readonly commActionsÀValoriser: string | null,
    public readonly commFreinsÀLever: string | null,
    public readonly commCommentairesSurLesDonnées: string | null,
    public readonly commAutresRésultats: string | null,
    public readonly commAutresRésultatsNonCorrélésAuxIndicateurs: string | null,
    public readonly decStratSuiviDesDécisions: string | null,
    public readonly objNotreAmbition: string | null,
    public readonly objDéjàFait: string | null,
    public readonly objÀFaire: string | null,
    public readonly synthèseDesRésultats: string | null,
  ) {}
}
