import {
  StatutProposition,
  StatutPropositionType,
} from "@/server/chantiers/domain/StatutProposition";
import { PropositionValeurAvancement } from "@/server/chantiers/domain/PropositionValeurAvancement";

export class PropositionValeurAvancementBuilder {
  private id: string = "cb6e5af4-065a-4a82-8a49-be3dea248330";

  private indicId: string = "IND-001";

  private valeurAvancementProposee: number = 12.3;

  private territoireCode: string = "DEPT-01";

  private dateValeurAvancement: Date = new Date("2023-03-12");

  private idAuteurModification: string = "b962181f-087c-442e-a899-dae59e3533cd";

  private auteurModification: string = "john.doe@test.com";

  private dateProposition: Date = new Date();

  private motifProposition: string = "Oublie de valeur";

  private sourceDonneeEtMethodeCalcul: string =
    "Une source mieux que l'ancienne";

  private statut: StatutPropositionType = StatutProposition.EN_COURS;

  avecId(id: string): PropositionValeurAvancementBuilder {
    this.id = id;
    return this;
  }

  avecIndicId(indicId: string): PropositionValeurAvancementBuilder {
    this.indicId = indicId;
    return this;
  }

  avecValeurAvancementProposee(
    valeurAvancementProposee: number,
  ): PropositionValeurAvancementBuilder {
    this.valeurAvancementProposee = valeurAvancementProposee;
    return this;
  }

  avecTerritoireCode(
    territoireCode: string,
  ): PropositionValeurAvancementBuilder {
    this.territoireCode = territoireCode;
    return this;
  }

  avecDateValeurAvancement(
    dateValeurAvancement: Date,
  ): PropositionValeurAvancementBuilder {
    this.dateValeurAvancement = dateValeurAvancement;
    return this;
  }

  avecIdAuteurModification(
    idAuteurModification: string,
  ): PropositionValeurAvancementBuilder {
    this.idAuteurModification = idAuteurModification;
    return this;
  }

  avecAuteurModification(
    auteurModification: string,
  ): PropositionValeurAvancementBuilder {
    this.auteurModification = auteurModification;
    return this;
  }

  avecDateProposition(
    dateProposition: Date,
  ): PropositionValeurAvancementBuilder {
    this.dateProposition = dateProposition;
    return this;
  }

  avecMotifProposition(
    motifProposition: string,
  ): PropositionValeurAvancementBuilder {
    this.motifProposition = motifProposition;
    return this;
  }

  avecSourceDonneeEtMethodeCalcul(
    sourceDonneeEtMethodeCalcul: string,
  ): PropositionValeurAvancementBuilder {
    this.sourceDonneeEtMethodeCalcul = sourceDonneeEtMethodeCalcul;
    return this;
  }

  avecStatut(
    statut: StatutPropositionType,
  ): PropositionValeurAvancementBuilder {
    this.statut = statut;
    return this;
  }

  build(): PropositionValeurAvancement {
    return PropositionValeurAvancement.creerPropositionValeurAvancement({
      id: this.id,
      indicId: this.indicId,
      valeurAvancementProposee: this.valeurAvancementProposee,
      territoireCode: this.territoireCode,
      dateValeurAvancement: this.dateValeurAvancement,
      idAuteurModification: this.idAuteurModification,
      auteurModification: this.auteurModification,
      dateProposition: this.dateProposition,
      motifProposition: this.motifProposition,
      sourceDonneeEtMethodeCalcul: this.sourceDonneeEtMethodeCalcul,
      statut: this.statut,
    });
  }
}
