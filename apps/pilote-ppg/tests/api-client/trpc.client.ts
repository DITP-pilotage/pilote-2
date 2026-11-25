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
    options: { headers?: Record<string, string> } = {},
  ): Promise<TrpcResult<T>> {
    const response = await this.page.request.post(`/api/trpc/${path}`, {
      data: superjson.serialize(input),
      headers: options.headers,
      maxRedirects: 0,
    });
    return this.toResult<T>(response);
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
