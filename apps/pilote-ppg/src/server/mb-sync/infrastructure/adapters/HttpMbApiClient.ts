import { configuration } from "@/config";
import {
  type MbApiClient,
  type UpsertIndicateurPayload,
  type UpsertValeurAvancementItem,
} from "@/server/mb-sync/domain/ports/MbApiClient";

const MAX_ITEMS_PAR_BATCH = 1000;

type BatchResultat = {
  total: number;
  created: number;
  updated: number;
};

export class HttpMbApiClient implements MbApiClient {
  async upsertValeursAvancementBatch(
    indicateurId: string,
    items: UpsertValeurAvancementItem[],
  ): Promise<number> {
    const { baseUrl, apiKey } = configuration().mbApi;
    let total = 0;

    for (let offset = 0; offset < items.length; offset += MAX_ITEMS_PAR_BATCH) {
      const chunk = items.slice(offset, offset + MAX_ITEMS_PAR_BATCH);

      const response = await fetch(
        `${baseUrl}/indicateurs/${indicateurId}/valeurs:batch`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ items: chunk }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `mb-api batch échoué pour l'indicateur ${indicateurId} : HTTP ${response.status} — ${body}`,
        );
      }

      const result = (await response.json()) as BatchResultat;
      total += result.total;
    }

    return total;
  }

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
