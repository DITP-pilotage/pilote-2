import { configuration } from "@/config";

const MAX_ITEMS_PAR_BATCH = 1000;

export type UpsertItem = {
  individu: string;
  date: string;
  valeur: number;
};

export type BatchResultat = {
  total: number;
  created: number;
  updated: number;
};

export class MbApiClient {
  async upsertBatch(
    indicateurId: string,
    items: UpsertItem[],
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
}
