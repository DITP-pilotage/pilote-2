import { APIResponse, Page } from "@playwright/test";
import superjson, { SuperJSONResult } from "superjson";

export type TrpcResult<T> = {
  status: number;
  data: T | null;
  errorCode: string | null;
  location: string | null;
};

type TrpcBody = {
  result?: { data: SuperJSONResult };
  error?: SuperJSONResult;
};

type TrpcErrorShape = { data?: { code?: string } };

export class TrpcClient {
  constructor(private readonly page: Page) {}

  // Chaque réponse renouvelle le cookie csrf : on quitte l'application pour qu'aucune
  // requête de fond ne le change entre sa lecture et l'envoi d'une mutation.
  static async outsideApp(page: Page): Promise<TrpcClient> {
    await page.goto("about:blank");
    return new TrpcClient(page);
  }

  async query<T>(path: string, input?: unknown): Promise<TrpcResult<T>> {
    const query =
      input === undefined
        ? ""
        : `?input=${encodeURIComponent(JSON.stringify(superjson.serialize(input)))}`;
    const response = await this.page.request.get(`/api/trpc/${path}${query}`, {
      maxRedirects: 0,
    });
    return this.toResult<T>(response);
  }

  async mutation<T>(
    path: string,
    input: Record<string, unknown>,
    options: { csrf?: string | null } = {},
  ): Promise<TrpcResult<T>> {
    const csrf =
      options.csrf === undefined ? await this.csrfFromCookie() : options.csrf;
    const body = csrf === null ? input : { ...input, csrf };
    const response = await this.page.request.post(`/api/trpc/${path}`, {
      data: superjson.serialize(body),
      maxRedirects: 0,
    });
    return this.toResult<T>(response);
  }

  private async csrfFromCookie(): Promise<string> {
    const cookies = await this.page.context().cookies();
    const csrf = cookies.find((cookie) => cookie.name === "csrf")?.value;
    if (!csrf) {
      throw new Error(
        "Cookie csrf absent : se connecter et charger une page avant d'appeler une mutation",
      );
    }
    return csrf;
  }

  private async toResult<T>(response: APIResponse): Promise<TrpcResult<T>> {
    const location = response.headers().location ?? null;
    const isJson = (response.headers()["content-type"] ?? "").includes(
      "application/json",
    );
    if (!isJson) {
      return {
        status: response.status(),
        data: null,
        errorCode: null,
        location,
      };
    }

    const body = (await response.json()) as TrpcBody;
    if (body.error) {
      const error = superjson.deserialize<TrpcErrorShape>(body.error);
      return {
        status: response.status(),
        data: null,
        errorCode: error.data?.code ?? null,
        location,
      };
    }

    return {
      status: response.status(),
      data: body.result ? superjson.deserialize<T>(body.result.data) : null,
      errorCode: null,
      location,
    };
  }
}
