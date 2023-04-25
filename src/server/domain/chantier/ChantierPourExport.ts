import assert from 'node:assert/strict';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee, Territoire } from '@/server/domain/territoire/Territoire.interface';
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

  public static fromChantierMailleTerritoire(chantier: Chantier, maille: Maille, territoire: Territoire) {
    let codeRégion = null;
    let codeDépartement = null;
    let tauxDAvancementNational = null;
    let tauxDAvancementRégional = null;
    let tauxDAvancementDépartemental = null;

    switch (maille) {
      case 'régionale': {
        codeRégion = 'REG-' + territoire.codeInsee;
        tauxDAvancementRégional = territoire.avancement.global;
        break;
      }
      case 'départementale': {
        codeDépartement = 'DEPT-' + territoire.codeInsee;
        break;
      }
      case 'nationale': {
        break;
      }
      default: {
        assert.fail('Maille inconnue : ' + maille);
      }
    }

    return new ChantierPourExport(
      chantier.id,
      maille as Maille,
      territoire.codeInsee,
      codeRégion,
      codeDépartement,
      tauxDAvancementNational,
      tauxDAvancementRégional,
      tauxDAvancementDépartemental,
      territoire.météo,
      chantier.estBaromètre,
      chantier.estTerritorialisé,
    );
  }

  public static fromChantier(chantier: Chantier): ChantierPourExport[] {
    const result = [];
    for (const [maille, territoires] of Object.entries(chantier.mailles)) {
      for (const territoire of Object.values(territoires)) {
        result.push(this.fromChantierMailleTerritoire(chantier, maille as Maille, territoire));
      }
    }
    return result;
  }
}
