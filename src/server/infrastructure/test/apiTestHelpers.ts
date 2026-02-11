import type { NextApiRequest, NextApiResponse } from "next";
import { Mock } from "vitest";

export function setupRequest(
  overrides: Partial<{ method: string; headers: Record<string, string> }> = {},
): NextApiRequest {
  return {
    method: "POST",
    headers: {},
    ...overrides,
  } as unknown as NextApiRequest;
}

export function setupResponse(): NextApiResponse & {
  status: Mock;
  json: Mock;
} {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json } as unknown as NextApiResponse & {
    status: Mock;
    json: Mock;
  };
}
