import { ChantierPourExport } from '@/server/chantiers/domain/ChantierPourExport';

export class ChantierPourExportBuilder {
  private nom: string | null = null;

  private id: string = 'chantierId';

  private maille = null;

  private régionNom = null;

  private départementNom = null;

  private codeInsee = null;

  private ministèreNom = null;

  private axe = null;

  private périmètreIds = [];

  private tauxDAvancementAnnuel = null;

  private tauxDAvancementNational = null;

  private tauxDAvancementRégional = null;

  private tauxDAvancementDépartemental = null;

  private météo = null;

  private directeursProjet = null;

  private directeursProjetMails = null;

  private responsablesLocaux = null;

  private responsablesLocauxMails = null;

  private coordinateursTerritoriaux = null;

  private coordinateursTerritoriauxMails = null;

  private estBaromètre = null;

  private estTerritorialisé = null;

  private statut = null;

  private commActionsÀVenir = null;

  private commActionsÀValoriser = null;

  private commFreinsÀLever = null;

  private commCommentairesSurLesDonnées = null;

  private commAutresRésultats = null;

  private commAutresRésultatsNonCorrélésAuxIndicateurs = null;

  private decStratSuiviDesDécisions = null;

  private objNotreAmbition = null;

  private objDéjàFait = null;

  private objÀFaire = null;

  private synthèseDesRésultats = null;

  private  ecart = null;

  private tendance = null;

  private avancementTerritoire = null;

  private cibleAttendue = true;

  private aUnePropositionsValeurActuelle = true;

  private aUnTauxAvancementDepartemental = true;

  public avecId(id: string): ChantierPourExportBuilder {
    this.id = id;
    return this;
  }

  public avecNom(nom: string | null): ChantierPourExportBuilder {
    this.nom = nom;
    return this;
  }

  public build(): ChantierPourExport {
    return {
      nom: this.nom,
      id: this.id,
      maille: this.maille,
      régionNom: this.régionNom,
      départementNom: this.départementNom,
      codeInsee: this.codeInsee,
      ministèreNom: this.ministèreNom,
      axe: this.axe,
      périmètreIds: this.périmètreIds,
      tauxDAvancementAnnuel: this.tauxDAvancementAnnuel,
      tauxDAvancementNational: this.tauxDAvancementNational,
      tauxDAvancementRégional: this.tauxDAvancementRégional,
      tauxDAvancementDépartemental: this.tauxDAvancementDépartemental,
      météo: this.météo,
      directeursProjet: this.directeursProjet,
      directeursProjetMails: this.directeursProjetMails,
      responsablesLocaux: this.responsablesLocaux,
      responsablesLocauxMails: this.responsablesLocauxMails,
      coordinateursTerritoriaux: this.coordinateursTerritoriaux,
      coordinateursTerritoriauxMails: this.coordinateursTerritoriauxMails,
      estBaromètre: this.estBaromètre,
      estTerritorialisé: this.estTerritorialisé,
      statut: this.statut,
      commActionsÀVenir: this.commActionsÀVenir,
      commActionsÀValoriser: this.commActionsÀValoriser,
      commFreinsÀLever: this.commFreinsÀLever,
      commCommentairesSurLesDonnées: this.commCommentairesSurLesDonnées,
      commAutresRésultats: this.commAutresRésultats,
      commAutresRésultatsNonCorrélésAuxIndicateurs: this.commAutresRésultatsNonCorrélésAuxIndicateurs,
      decStratSuiviDesDécisions: this.decStratSuiviDesDécisions,
      objNotreAmbition: this.objNotreAmbition,
      objDéjàFait: this.objDéjàFait,
      objÀFaire: this.objÀFaire,
      synthèseDesRésultats: this.synthèseDesRésultats,
      ecart: this.ecart,
      tendance: this.tendance, 
      avancementTerritoire: this.avancementTerritoire, 
      cibleAttendu: this.cibleAttendue,
      aUnePropositionsValeurActuelle: this.aUnePropositionsValeurActuelle,
      aUnTauxAvancementDepartemental: this.aUnTauxAvancementDepartemental,
    };
  }
}
