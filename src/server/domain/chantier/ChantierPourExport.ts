import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export class ChantierPourExport {
  constructor(
    public readonly chantierId: string,
    public readonly maille: Maille,
    public readonly codeInsee: CodeInsee,
    public readonly codeRégion: string | null,
    public readonly codeDépartement: string | null,
    public readonly tauxDAvancementNational: number | null,
    public readonly tauxDAvancementRégional: number | null,
    public readonly tauxDAvancementDépartemental: number | null,
    public readonly météo: Météo,
    public readonly estBaromètre: boolean,
    public readonly estTerritorialisé: boolean,
  ) {}
}