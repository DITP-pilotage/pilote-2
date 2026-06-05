import { configuration } from "@/config";
import {
  type MbIndicateurClient,
  type UpsertIndicateurPayload,
} from "@/server/mb-sync/domain/ports/MbIndicateurClient";

export class HttpMbIndicateurClient implements MbIndicateurClient {
  async upsertIndicateur(
    id: string,
    payload: UpsertIndicateurPayload,
  ): Promise<void> {
    const { baseUrl, apiKey } = configuration().mbApi;

    const response = await fetch(`${baseUrl}/indicateurs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `mb-api upsert indicateur échoué pour ${id} : HTTP ${response.status} — ${body}`,
      );
    }
  }
}
