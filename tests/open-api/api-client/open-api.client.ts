import { APIRequestContext, APIResponse } from "@playwright/test";
import { ImportCommentaireInput } from "@/validation/import-commentaire";

export type CommentaireInput = ImportCommentaireInput;

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

  async dispose(): Promise<void> {
    await this.apiContext.dispose();
  }
}
