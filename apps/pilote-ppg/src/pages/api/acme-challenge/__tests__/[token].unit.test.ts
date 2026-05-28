import type { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/acme-challenge/[token]";
import { acmeChallengeStore } from "@/server/infrastructure/acme/acmeChallengeStore";

function buildRequest({
  method = "GET",
  token,
}: {
  method?: string;
  token?: string;
}): NextApiRequest {
  return {
    method,
    query: token === undefined ? {} : { token },
  } as unknown as NextApiRequest;
}

function buildResponse() {
  const setHeader = vi.fn();
  const send = vi.fn();
  const end = vi.fn();
  const status = vi.fn(() => ({ send, end }));
  return {
    response: {
      setHeader,
      status,
    } as unknown as NextApiResponse,
    setHeader,
    status,
    send,
    end,
  };
}

describe("GET /api/acme-challenge/[token]", () => {
  beforeEach(() => {
    acmeChallengeStore.clear();
  });

  it("retourne 200 avec la keyAuthorization et un Content-Type text/plain", () => {
    // Given
    acmeChallengeStore.set("abc123", "abc123.thumbprint");
    const request = buildRequest({ token: "abc123" });
    const { response, setHeader, status, send } = buildResponse();

    // When
    handler(request, response);

    // Then
    expect(setHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith("abc123.thumbprint");
  });

  it("retourne 404 quand le token est absent du store", () => {
    // Given
    const request = buildRequest({ token: "inconnu" });
    const { response, status, end } = buildResponse();

    // When
    handler(request, response);

    // Then
    expect(status).toHaveBeenCalledWith(404);
    expect(end).toHaveBeenCalled();
  });

  it("retourne 405 quand la méthode n'est pas GET", () => {
    // Given
    const request = buildRequest({ method: "POST", token: "abc123" });
    const { response, status, end } = buildResponse();

    // When
    handler(request, response);

    // Then
    expect(status).toHaveBeenCalledWith(405);
    expect(end).toHaveBeenCalled();
  });
});
