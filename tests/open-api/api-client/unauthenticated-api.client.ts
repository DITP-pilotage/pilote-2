import Playwright from "playwright-core";
import { OpenApiClient } from "./open-api.client";

export type AuthorizationHeader = {
  value?: string;
  skip?: boolean;
};

export async function createUnauthenticatedClient(
  playwright: typeof Playwright,
  authorization?: AuthorizationHeader,
): Promise<OpenApiClient> {
  const extraHTTPHeaders: Record<string, string> = {};

  if (authorization && !authorization.skip && authorization.value) {
    extraHTTPHeaders["Authorization"] = authorization.value;
  }

  const apiContext = await playwright.request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders,
  });

  return new OpenApiClient(apiContext);
}
