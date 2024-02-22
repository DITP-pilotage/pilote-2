import { MeteoDisponible } from '@/server/fiche-territoriale/domain/MeteoDisponible';
import { Ministere } from '@/server/fiche-territoriale/domain/Ministere';
import { SyntheseDesResultats } from '@/server/fiche-territoriale/domain/SyntheseDesResultats';
import { Indicateur } from '@/server/fiche-territoriale/domain/Indicateur';
import { IndicateurFicheTerritoriale } from '@/server/fiche-territoriale/domain/IndicateurFicheTerritoriale';

export class ChantierFicheTerritoriale {
  private readonly _nom: string;

  private readonly _meteo: MeteoDisponible | null;

  private readonly _ministerePorteur: Ministere;

  private readonly _dateQualitative: string;

  private readonly _tauxAvancement: number | null;

  private readonly _dateQuantitative: string;

  private readonly _indicateurs: IndicateurFicheTerritoriale[];

  private constructor({ tauxAvancement, meteo, nom, ministerePorteur, dateQualitative, dateQuantitative, indicateurs }: { tauxAvancement: number | null, meteo: MeteoDisponible | null, nom: string, ministerePorteur: Ministere, dateQualitative: string, dateQuantitative: string, indicateurs: IndicateurFicheTerritoriale[] }) {
    this._tauxAvancement = tauxAvancement;
    this._meteo = meteo;
    this._nom = nom;
    this._ministerePorteur = ministerePorteur;
    this._dateQualitative = dateQualitative;
    this._dateQuantitative = dateQuantitative;
    this._indicateurs = indicateurs;
  }


  get tauxAvancement(): number | null {
    return this._tauxAvancement;
  }

  get meteo(): MeteoDisponible | null {
    return this._meteo;
  }

  get nom(): string {
    return this._nom;
  }

  get ministerePorteur(): Ministere {
    return this._ministerePorteur;
  }

  get dateQualitative(): string {
    return this._dateQualitative;
  }

  get dateQuantitative(): string {
    return this._dateQuantitative;
  }

  get indicateurs(): IndicateurFicheTerritoriale[] {
    return this._indicateurs;
  }

  static creerChantierFicheTerritoriale({ tauxAvancement, meteo, nom, ministerePorteur, dateQualitative, dateQuantitative, indicateurs }: { tauxAvancement: number | null, meteo: MeteoDisponible | null, nom: string, ministerePorteur: Ministere, dateQualitative: string, dateQuantitative: string, indicateurs: IndicateurFicheTerritoriale[] }): ChantierFicheTerritoriale {
    return new ChantierFicheTerritoriale({ tauxAvancement, meteo, nom, ministerePorteur, dateQualitative, dateQuantitative, indicateurs });
  }

  static calculerDateQualitative(syntheseDesResultats: SyntheseDesResultats[]) {
    return syntheseDesResultats.flatMap(syntheseDesResultat => [syntheseDesResultat.dateMeteo, syntheseDesResultat.dateCommentaire]).sort().reverse()[0] || '';
  }

  static calculerDateQuantitative(indicateurs: Indicateur[]) {
    return indicateurs.map(indicateur => indicateur.dateValeurActuelle).sort().reverse()[0] || '';
  }
}
