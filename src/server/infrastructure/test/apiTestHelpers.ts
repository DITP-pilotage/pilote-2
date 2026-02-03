import type { NextApiRequest, NextApiResponse } from "next";

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
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json } as unknown as NextApiResponse & {
    status: jest.Mock;
    json: jest.Mock;
  };
}
