import { configuration } from "@/config";
import {
  type DeleteObjectifIndicateurItem,
  type DeleteValeurAvancementItem,
  type MbApiClient,
  type UpsertIndicateurPayload,
  type UpsertObjectifIndicateurItem,
  type UpsertValeurAvancementItem,
} from "@/server/mb-sync/domain/ports/MbApiClient";

const MAX_ITEMS_PAR_BATCH = 1000;

type BatchResultat = {
  total: number;
  created: number;
  updated: number;
};

export class HttpMbApiClient implements MbApiClient {
  async upsertValeursAvancementBatch(args: {
    indicId: string;
    items: UpsertValeurAvancementItem[];
  }): Promise<number> {
    const { baseUrl, apiKey } = configuration().mbApi;
    const { items, indicId } = args;
    let total = 0;

    for (let offset = 0; offset < items.length; offset += MAX_ITEMS_PAR_BATCH) {
      const chunk = items.slice(offset, offset + MAX_ITEMS_PAR_BATCH);

      const response = await fetch(
        `${baseUrl}/indicateurs/${indicId}/valeurs:batch`,
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
          `mb-api batch échoué pour l'indicateur ${indicId} : HTTP ${response.status} — ${body}`,
        );
      }

      const result = (await response.json()) as BatchResultat;
      total += result.total;
    }

    return total;
  }

  async deleteValeursAvancement(args: {
    indicId: string;
    items: DeleteValeurAvancementItem[];
  }): Promise<number> {
    const { baseUrl, apiKey } = configuration().mbApi;
    const { indicId, items } = args;

    for (const item of items) {
      const response = await fetch(
        `${baseUrl}/indicateurs/${indicId}/valeurs`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(item),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `mb-api delete valeur échoué pour l'indicateur ${indicId} (individu=${item.individu}, date=${item.date}) : HTTP ${response.status} — ${body}`,
        );
      }
    }

    return items.length;
  }

  async upsertObjectifsIndicateurBatch(args: {
    indicId: string;
    items: UpsertObjectifIndicateurItem[];
  }): Promise<number> {
    const { baseUrl, apiKey } = configuration().mbApi;
    const { items, indicId } = args;
    let total = 0;

    for (let offset = 0; offset < items.length; offset += MAX_ITEMS_PAR_BATCH) {
      const chunk = items.slice(offset, offset + MAX_ITEMS_PAR_BATCH);

      const response = await fetch(
        `${baseUrl}/indicateurs/${indicId}/objectifs:batch`,
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
          `mb-api batch objectifs échoué pour l'indicateur ${indicId} : HTTP ${response.status} — ${body}`,
        );
      }

      const result = (await response.json()) as BatchResultat;
      total += result.total;
    }

    return total;
  }

  async deleteObjectifIndicateur(args: {
    indicId: string;
    item: DeleteObjectifIndicateurItem;
  }): Promise<void> {
    const { baseUrl, apiKey } = configuration().mbApi;
    const { indicId, item } = args;

    const response = await fetch(
      `${baseUrl}/indicateurs/${indicId}/objectifs`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          individu: item.individu,
          dateCible: item.dateCible,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `mb-api delete objectif échoué pour l'indicateur ${indicId} (individu=${item.individu}, dateCible=${item.dateCible}) : HTTP ${response.status} — ${body}`,
      );
    }
  }

  async upsertIndicateur(args: {
    indicId: string;
    payload: UpsertIndicateurPayload;
  }): Promise<void> {
    const { baseUrl, apiKey } = configuration().mbApi;

    const response = await fetch(`${baseUrl}/indicateurs/${args.indicId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(args.payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `mb-api upsert indicateur échoué pour ${args.indicId} : HTTP ${response.status} — ${body}`,
      );
    }
  }
}
