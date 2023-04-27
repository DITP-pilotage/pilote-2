import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export class ChantierPourExport {
  constructor(
    public readonly chantierId: string,
    public readonly nom: string | null,
    public readonly maille: Maille,
    public readonly codeInsee: CodeInsee,
    public readonly codeRégion: string | null,
    public readonly codeDépartement: string | null,
    public readonly ministère: string | null,
    public readonly tauxDAvancementNational: number | null,
    public readonly tauxDAvancementRégional: number | null,
    public readonly tauxDAvancementDépartemental: number | null,
    public readonly météo: Météo,
    public readonly estBaromètre: boolean,
    public readonly estTerritorialisé: boolean,
    public readonly objectif: string | null,
    public readonly actionÀVenir: string | null,
    public readonly freinÀLever: string | null,
    public readonly synthèseDesResultats: string | null,
  ) {}
}
