import { APIRequestContext, APIResponse } from "@playwright/test";
import { ImportCommentaireInput } from "@/validation/import-commentaire";
import { ImportDecisionStrategiqueInput } from "@/validation/import-decision-strategique";
import { ImportObjectifInput } from "@/validation/import-objectif";
import { ImportSyntheseDesResultatsOpenAPIInput } from "@/validation/import-synthese-des-resultats";

export type CommentaireInput = ImportCommentaireInput;
export type DecisionStrategiqueInput = ImportDecisionStrategiqueInput;
export type ObjectifInput = ImportObjectifInput;
export type SyntheseDesResultatsInput = ImportSyntheseDesResultatsOpenAPIInput;

export class OpenApiClient {
  constructor(private readonly apiContext: APIRequestContext) {}

  async healthcheck(): Promise<APIResponse> {
    return this.apiContext.get("/api/open-api/healthcheck");
  }

  async getChantierDonnees(chantierId: string): Promise<APIResponse> {
    return this.apiContext.get(`/api/open-api/chantier/${chantierId}/donnees`);
  }

  async getIndicateurDonnees(
    chantierId: string,
    indicateurId: string,
  ): Promise<APIResponse> {
    return this.apiContext.get(
      `/api/open-api/chantier/${chantierId}/indicateur/${indicateurId}/donnees`,
    );
  }

  async importCommentaires(
    chantierId: string,
    commentaires: CommentaireInput[],
  ): Promise<APIResponse> {
    return this.apiContext.post(
      `/api/open-api/chantier/${chantierId}/commentaires`,
      {
        data: { commentaires },
      },
    );
  }

  async importDecisionsStrategiques(
    chantierId: string,
    decisions: DecisionStrategiqueInput[],
  ): Promise<APIResponse> {
    return this.apiContext.post(
      `/api/open-api/chantier/${chantierId}/decisions-strategiques`,
      {
        data: { decisions_strategiques: decisions },
      },
    );
  }

  async importObjectifs(
    chantierId: string,
    objectifs: ObjectifInput[],
  ): Promise<APIResponse> {
    return this.apiContext.post(
      `/api/open-api/chantier/${chantierId}/objectifs`,
      {
        data: { objectifs },
      },
    );
  }

  async importSynthesesDesResultats(
    chantierId: string,
    syntheses: SyntheseDesResultatsInput[],
  ): Promise<APIResponse> {
    return this.apiContext.post(
      `/api/open-api/chantier/${chantierId}/syntheses-des-resultats`,
      {
        data: { syntheses_des_resultats: syntheses },
      },
    );
  }

  async dispose(): Promise<void> {
    await this.apiContext.dispose();
  }
}
