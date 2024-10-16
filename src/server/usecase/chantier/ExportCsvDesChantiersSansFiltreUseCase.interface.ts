import { Météo } from '@/server/domain/météo/Météo.interface';

export type ChantierPourExport = {
  nom: string | null,
  id: string | null,
  maille: string | null,
  régionNom: string | null,
  départementNom: string | null,
  ministèreNom: string | null,
  axe: string | null,
  périmètreIds: string[],
  tauxDAvancementAnnuel: number | null,
  tauxDAvancementNational: number | null,
  tauxDAvancementRégional: number | null,
  tauxDAvancementDépartemental: number | null,
  météo: Météo | null,
  directeursProjet: string[] | null,
  directeursProjetMails: string[] | null,
  responsablesLocaux: string[] | null,
  responsablesLocauxMails: string[] | null,
  estBaromètre: boolean | null,
  estTerritorialisé: boolean | null,
  statut: string | null,
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

export class ChantierPourExportBuilder  {
  private _chantierPourExport: ChantierPourExport = {
    nom: null,
    id: null,
    maille: null,
    régionNom: null,
    départementNom: null,
    ministèreNom: null,
    axe: null,
    périmètreIds: [],
    tauxDAvancementAnnuel: null,
    tauxDAvancementNational: null,
    tauxDAvancementRégional: null,
    tauxDAvancementDépartemental: null,
    météo: null,
    directeursProjet: null,
    directeursProjetMails: null,
    responsablesLocaux: null,
    responsablesLocauxMails: null,
    estBaromètre: null,
    estTerritorialisé: null,
    statut: null,
    commActionsÀVenir: null,
    commActionsÀValoriser: null,
    commFreinsÀLever: null,
    commCommentairesSurLesDonnées: null,
    commAutresRésultats: null,
    commAutresRésultatsNonCorrélésAuxIndicateurs: null,
    decStratSuiviDesDécisions: null,
    objNotreAmbition: null,
    objDéjàFait: null,
    objÀFaire: null,
    synthèseDesRésultats: null,
  };

  public avecNom(nom: string | null): ChantierPourExportBuilder {
    this._chantierPourExport.nom = nom;
    return this;
  }

  public build(): ChantierPourExport {
    return this._chantierPourExport;
  }
}
